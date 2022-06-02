// SPDX-License-Identifier: MIT

pragma solidity >=0.8.9 <0.9.0;

import './ERC721A.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/cryptography/MerkleProof.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

contract MyTestBet is ERC721A, Ownable, ReentrancyGuard {

  using Strings for uint256;

  string public uriPrefix = '';
  string public uriSuffix = '.json';
  string public hiddenMetadataUri;
  
  uint256 public cost = 0.001 ether;
  uint256 public maxSupply = 4800;
  uint256 public maxMintAmountPerTx = 50;
  uint256 public maxNFTPerAccount = 100;
  uint256 public timeLimit;
  mapping(address => uint256) public addressMintedBalance;     

  bool public paused = false;
  bool public revealed = false;

  constructor(
  ) ERC721A("LoremIsem", "LI") {
    setHiddenMetadataUri("ipfs://QmThxUzNGmxE6CPxZjUAVRdCw5TCGQ8zabvcF7wPqXt3kM/hidden.json");
    timeLimit = block.timestamp + getDelay();
  }

  modifier mintCompliance(uint256 _mintAmount) {
    require(_mintAmount > 0 && _mintAmount <= maxMintAmountPerTx, 'Invalid mint amount!');
    require(totalSupply() + _mintAmount <= maxSupply, 'max Pepe limit exceeded!');
    require(_mintAmount + addressMintedBalance[msg.sender] <= maxNFTPerAccount, "You reach maximum Pepe per address!");
    _;
  }

  modifier mintPriceCompliance(uint256 _mintAmount) {
    require(msg.value >= getCurrentPrice(_mintAmount), 'Insufficient funds!');
    _;
  }

  function Mint(uint256 _mintAmount) public payable nonReentrant mintCompliance(_mintAmount) mintPriceCompliance(_mintAmount) {
    require(!paused, 'The contract is paused!');
    require(
      block.timestamp <= timeLimit ,
      "The game is ended, we already have the winner!"
    );
    addressMintedBalance[msg.sender]++;
    _safeMint(_msgSender(), _mintAmount);
    timeLimit = block.timestamp + getDelay();
  }

  function getCurrentPrice(uint256 _mintAmount) public view returns (uint256) {
      uint256 step = 5;
      uint256 counter = totalSupply();
      uint256 finalPrice;
      for (uint256 i = 0; i < _mintAmount; i++) {
        uint256 currentPrice = cost * 2**(counter/step);
        counter++;
        finalPrice = finalPrice + currentPrice;
      }
      return finalPrice;
  }

  function getWinner() public view returns (address) {
      uint256 currentWinnerID = totalSupply() - 1;
      address currentWinner = ownerOf(currentWinnerID);
      return currentWinner;
  }

  function getDelay() private view returns (uint256) {
    //Halving every 300 units after 1200 NFTs sold
      uint256 cuurentMint = totalSupply();
      uint256 delayTime;
      if (cuurentMint <= 10) {
        delayTime = 2629743;
      }else if(cuurentMint > 10 && cuurentMint <= 15){
        delayTime = 1209600;
        }else if(cuurentMint > 15 && cuurentMint <= 20){
        delayTime = 604800;
      }else if(cuurentMint > 20 && cuurentMint <= 25){
        delayTime = 345600;
      }else if(cuurentMint > 25 && cuurentMint <= 30){
        delayTime = 172800;
      }else if(cuurentMint > 30 && cuurentMint <= 35){
        delayTime = 86400;
      }else{
        delayTime = 500;
      }
      return delayTime;
  }

  function walletOfOwner(address _owner) public view returns (uint256[] memory) {
    uint256 ownerTokenCount = balanceOf(_owner);
    uint256[] memory ownedTokenIds = new uint256[](ownerTokenCount);
    uint256 currentTokenId = _startTokenId();
    uint256 ownedTokenIndex = 0;
    address latestOwnerAddress;

    while (ownedTokenIndex < ownerTokenCount && currentTokenId < _currentIndex) {
      TokenOwnership memory ownership = _ownerships[currentTokenId];

      if (!ownership.burned) {
        if (ownership.addr != address(0)) {
          latestOwnerAddress = ownership.addr;
        }

        if (latestOwnerAddress == _owner) {
          ownedTokenIds[ownedTokenIndex] = currentTokenId;

          ownedTokenIndex++;
        }
      }

      currentTokenId++;
    }

    return ownedTokenIds;
  }

  function _startTokenId() internal view virtual override returns (uint256) {
    return 1;
  }

  function tokenURI(uint256 _tokenId) public view virtual override returns (string memory) {
    require(_exists(_tokenId), 'ERC721Metadata: URI query for nonexistent token');

    if (revealed == false) {
      return hiddenMetadataUri;
    }

    string memory currentBaseURI = _baseURI();
    return bytes(currentBaseURI).length > 0
        ? string(abi.encodePacked(currentBaseURI, _tokenId.toString(), uriSuffix))
        : '';
  }

  function setRevealed(bool _state) public onlyOwner {
    revealed = _state;
  }

  function setCost(uint256 _cost) public onlyOwner {
    cost = _cost;
  }

  function setMaxMintAmountPerTx(uint256 _maxMintAmountPerTx) public onlyOwner {
    maxMintAmountPerTx = _maxMintAmountPerTx;
  }

  function setHiddenMetadataUri(string memory _hiddenMetadataUri) public onlyOwner {
    hiddenMetadataUri = _hiddenMetadataUri;
  }

  function setUriPrefix(string memory _uriPrefix) public onlyOwner {
    uriPrefix = _uriPrefix;
  }

  function setUriSuffix(string memory _uriSuffix) public onlyOwner {
    uriSuffix = _uriSuffix;
  }

  function setPaused(bool _state) public onlyOwner {
    paused = _state;
  }

  function resetMaxSupply() external onlyOwner {
    require(
      block.timestamp >= timeLimit ,
      "The game is ongoing, we have the wait for the winner!"
    );
    maxSupply = totalSupply();
  }


  function withdraw() public onlyOwner nonReentrant {
    require(
      block.timestamp >= timeLimit ,
      "The game is ongoing, we have the wait for the winner!"
    );
    // Pay for winner
    uint256 totalBalance = address(this).balance;
    (bool w, ) = payable(getWinner()).call{value: totalBalance * 55 / 100}("");
    require(w);
    // Pay for second prize winner
    (bool s, ) = payable(ownerOf(totalSupply())).call{value: totalBalance * 5 / 100}("");
    require(s);
    // Send to claim pool
    (bool cl, ) = payable(0xc7bae424C11E1ef9a005aeE8185E973116Fc5A9E).call{value: totalBalance * 10 / 100}("");
    require(cl);
    // =============================================================================
    (bool os, ) = payable(owner()).call{value: address(this).balance}("");
    require(os);
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return uriPrefix;
  }
}