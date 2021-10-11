//Let's create and unload the metadata on IPFS
var IPFSHttpClient = require('ipfs-http-client');

var ipfs = new IPFSHttpClient();

var metadata = {
    licence_url : 'https://my.awesome_licence.com',
    image : 'https://ipfs.io/ipfs/xxxx',
    description : "My Item is the best on earth!"
}

var fileToUpload = [new Blob([JSON.stringify(metadata, null, 4)], { type: "application/json" })];

var metadataLink = "ipfs://ipfs/";
for await (var upload of ipfs.add(fileToUpload)) {
    metadataLink += upload.path;
    break;
}

//Name and symbol are mandatory
var name = "MyAwesomeToken";
var symbol = "MAT";

//means that the ERC1155 side has 18 decimals, 1 if false
var hasDecimals = true;

//Set the Collection host. It will have the power to mint new Items, mint new tokens for an existing Item and to change Collection and Item Uris
var extensionAddress = web3.eth.accounts[0];

//An extension can also be a Smart Contract. If so, it is possible to specify an optional payload that the brand-new Collection will use to init the extension
var extensionPayload = "0x";

//The Native Collection creation is done by calling the Orchestrator which, internally, calls the active Factory.
//To make the structure fully upgradable, the Orchestrator will pass to the Factory an abi-encoded payload containing the parameters and the function to call the Native Collection model.

//Let's grab the first 8 bytes of the Native Model init(...) method signature
var initPayload = web3.utils.sha3("init(string,string,bool,string,address,bytes)");
initPayload = initPayload.substring(0, 10);

//Let's build the data payload
var initPayloadData = web3.eth.abi.encodeParameters([
    "string",
    "string",
    "bool",
    "string",
    "address",
    "bytes"
], [
    name,
    symbol,
    hasDecimals,
    metadataLink,
    extensionAddress,
    extensionPayload
]);

//Now fuse all together
initPayload += initPayloadData.substring(2);

//Take the current block number, useful for search later
var blockNumber = web3.eth.getBlockNumber();

await ethItemOrchestrator.methods.createNative(initPayload).send();

//Unfortunately, it is not actually possible to grab return types of Smart Contract from web3, so we need to search for the NatvieCreated event in the blockchain to retrieve the new item
var logs = await web3.eth.getPastLogs({
    address : await orchestrator.methods.factory().call(),
    topics : [web3.utils.sha3("NewNativeCreated(address,uint256,address,address)")],
    fromBlock : blockNumber,
    toBlock : 'latest'
});

var collectionAddress = web3.eth.abi.decodeParameter("address", logs[0].topics[log.topics.length - 1]);

var collection = {
    address : collectionAddress,
    category : "Native",
    contract : new web3.eth.Contract(configuration.NativeABI, collectionAddress)
};

//Let's change the URI
metadata.licence_url = "https://another.uri.licence.com";

fileToUpload = [new Blob([JSON.stringify(metadata, null, 4)], { type: "application/json" })];

metadataLink = "ipfs://ipfs/";
for await (var upload of ipfs.add(fileToUpload)) {
    metadataLink += upload.path;
    break;
}

await collection.contract.methods.setUri(metadataLink).send();

//It is also possible to totally lose the host property of a Collection. THIS IS A IRREVERSIBLE FUNCTION
collection.contract.methods.releaseExtension().send();

//From now on, it will not be possible to mint new Items or change the URIs
