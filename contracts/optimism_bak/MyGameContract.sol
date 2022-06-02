// SPDX-License-Identifier: MIT


pragma solidity >=0.7.0 <0.9.0;

import "./ERC721.sol";
import "./Counters.sol";
import "./Context.sol";
import "./Ownable.sol";
import "./ReentrancyGuard.sol";

contract MyGameContract is ERC721, Ownable, ReentrancyGuard {
  using Strings for uint256;
  using Counters for Counters.Counter;

  Counters.Counter private supply;

  string public uriPrefix = "";
  string public uriSuffix = ".json";
  string public hiddenMetadataUri;
  uint256 public maxSupply = 4800;
  uint256 public currentMaxSupply = 3000;
  uint256 public cost = 0.001 ether;
  uint256 public maxMintAmountPerTx = 2;
  uint256 public maxNFTPerAccount = 100;
  uint256 public timeLimit;
  mapping(address => uint256) public addressMintedBalance;                                                           

  bool public paused = false;
  bool public revealed = false;

  constructor() ERC721("Luna Pepe", "LP") {
    setHiddenMetadataUri("ipfs://QmSUA72mGbz3cKZyC1X5dv2AS9wjWGDdb41H8QyPweXsrN/hidden.json");
    timeLimit = block.timestamp + 604800;
  }

// Modifier 
  modifier mintCompliance(uint256 _mintAmount) {
    require(_mintAmount > 0 && _mintAmount <= maxMintAmountPerTx, "Invalid mint amount!");
    require(_mintAmount + addressMintedBalance[msg.sender] <= maxNFTPerAccount, "You reach maximum Pepe per address!");
    _;
  }

  function totalSupply() public view returns (uint256) {
    return supply.current();
  }

  function mintPepe(uint256 _mintAmount) 
    public 
    payable 
    nonReentrant 
    mintCompliance(_mintAmount)
  {
    require(!paused, "The contract is paused!");
    require(
      block.timestamp <= timeLimit ,
      "The game is ended, we already have the winner!"
    );
    require(
      supply.current() + _mintAmount <= currentMaxSupply,
      "max Pepe limit exceeded."
    );
    require(msg.value >= getCurrentPrice(_mintAmount), "Mint Pepe : insufficient funds.");
    
    _mintLoop(msg.sender, _mintAmount);
  }

  function pumpMaxSupply() 
    public 
    payable 
    nonReentrant 
  {
    require(!paused, "The contract is paused!");
    require(
      currentMaxSupply + 10 <= maxSupply,
      "You reach the limit of max supply."
    );
    require(msg.value >= getCurrentPrice(1) / 2, "Pump max supply : insufficient funds."); 
    require(
      block.timestamp <= timeLimit ,
      "The game is ended, we already have the winner!"
    );
    currentMaxSupply = currentMaxSupply + 10;
  }
  
  function mintForAddress(uint256 _mintAmount, address _receiver) public onlyOwner {
    _mintLoop(_receiver, _mintAmount);
  }

  function burnPepe(uint256 tokenId) public { 
     require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721Burnable: caller is not owner nor approved");
        _burn(tokenId);
  }

  function walletOfOwner(address _owner)
    public
    view
    returns (uint256[] memory)
  {
    uint256 ownerTokenCount = balanceOf(_owner);
    uint256[] memory ownedTokenIds = new uint256[](ownerTokenCount);
    uint256 currentTokenId = 1;
    uint256 ownedTokenIndex = 0;
  
    while (ownedTokenIndex < ownerTokenCount && currentTokenId <= supply.current()) {
      if (_exists(currentTokenId)) {
        address currentTokenOwner = ownerOf(currentTokenId);

        if (currentTokenOwner == _owner) {
          ownedTokenIds[ownedTokenIndex] = currentTokenId;

          ownedTokenIndex++;
        }
      } 
      currentTokenId++;
    }
    return ownedTokenIds;
  }

  function getCurrentPrice(uint256 _mintAmount) public view returns (uint256) {
      uint256 step = 5;
      uint256 counter = supply.current();
      uint256 finalPrice;
      for (uint256 i = 0; i < _mintAmount; i++) {
        uint256 currentPrice = cost * 2**(counter/step);
        counter++;
        finalPrice = finalPrice + currentPrice;
      }
      return finalPrice;
  }

  function getWinner() public view returns (address) {
      uint256 currentWinnerID = supply.current() - 1;
      address currentWinner = ownerOf(currentWinnerID);
      return currentWinner;
  }

  function tokenURI(uint256 _tokenId)
    public
    view
    virtual
    override
    returns (string memory)
  {
    require(
      _exists(_tokenId),
      "ERC721Metadata: URI query for nonexistent token"
    );

    if (revealed == false) {
      return hiddenMetadataUri;
    }
    string memory currentBaseURI = _baseURI();
    return bytes(currentBaseURI).length > 0
        ? string(abi.encodePacked(currentBaseURI, _tokenId.toString(), uriSuffix))
        : "";
  }

// SETTING parameter

  function setRevealed(bool _state) external onlyOwner {
    revealed = _state;
  }

  function setCost(uint256 _cost) external onlyOwner {
    cost = _cost;
  }

  function setMaxMintAmountPerTx(uint256 _maxMintAmountPerTx) external onlyOwner {
    maxMintAmountPerTx = _maxMintAmountPerTx;
  }

  function setMaxNFTPerAccount(uint256 _maxNFT) external onlyOwner {
    maxNFTPerAccount = _maxNFT;
  }

  function setHiddenMetadataUri(string memory _hiddenMetadataUri) public onlyOwner {
    hiddenMetadataUri = _hiddenMetadataUri;
  }

  function setUriPrefix(string memory _uriPrefix) external onlyOwner {
    uriPrefix = _uriPrefix;
  }

  function setUriSuffix(string memory _uriSuffix) external onlyOwner {
    uriSuffix = _uriSuffix;
  }

  function setPaused(bool _state) external onlyOwner {
    paused = _state;
  }

  function resetMaxSupply() external onlyOwner {
    require(
      block.timestamp >= timeLimit ,
      "The game is ongoing, we have the wait for the winner!"
    );
    maxSupply = supply.current();
  }

  function withdraw() public onlyOwner {
    require(
      block.timestamp >= timeLimit ,
      "The game is ongoing, we have the wait for the winner!"
    );
    // Pay for winner
    uint256 totalBalance = address(this).balance;
    (bool w, ) = payable(getWinner()).call{value: totalBalance * 55 / 100}("");
    require(w);
    // Pay for second prize winner
    (bool s, ) = payable(ownerOf(supply.current())).call{value: totalBalance * 5 / 100}("");
    require(s);
    // Send to claim pool
    (bool cl, ) = payable(0xc7bae424C11E1ef9a005aeE8185E973116Fc5A9E).call{value: totalBalance * 10 / 100}("");
    require(cl);
    // =============================================================================
    (bool os, ) = payable(owner()).call{value: address(this).balance}("");
    require(os);
    
  }

  function _mintLoop(address _receiver, uint256 _mintAmount) internal {
    for (uint256 i = 0; i < _mintAmount; i++) {
      supply.increment();
      addressMintedBalance[_receiver]++;
      timeLimit = block.timestamp + 86400;
      _safeMint(_receiver, supply.current());
    }
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return uriPrefix;
  }
}