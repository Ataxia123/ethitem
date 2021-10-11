pragma solidity ^0.7.4;

contract ExtensionExample {
    address private _collection;

    address private _owner;

    constructor() {
        _owner = msg.sender;
    }

    function owner() public view returns(address) {
        return _owner;
    }

    function collection() public view returns(address) {
        return _collection;
    }

    modifier ownerOnly {
        require(msg.sender == _owner, "Bad boy!");
        _;
    }

    function init() public {
        require(_collection == address(0), "Init already called!");
        _collection = msg.sender;
    }

    function setOwner(address newOwner) public ownerOnly {
        _owner = newOwner;
    }

    function mint(uint256 amount, string memory tokenName, string memory tokenSymbol, string memory objectUri, bool editable) public ownerOnly {
        (,address tokenAddress) = IEthItem(_collection).mint(amount, tokenName, tokenSymbol, objectUri, editable);
        IERC20 token = IERC20(tokenAddress);
        token.transfer(msg.sender, token.balanceOf(address(this)));
    }
}

interface IEthItem {
    function mint(uint256 amount, string calldata tokenName, string calldata tokenSymbol, string calldata objectUri, bool editable) external returns (uint256 objectId, address tokenAddress);
}

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
}                                            
