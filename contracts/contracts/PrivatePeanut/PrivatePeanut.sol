// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//////////////////////////////////////////////////////////////////////////////////////
// @title   Peanut Protocol
// @notice  This contract is used to send probabilistically private payment links
//          The main component used here is IEXEC's TEE technology
//          more at: https://peanut.to & https://iex.ec
// @version 0.1
// @author  Hugo Montenegro, Mikolaj Glinka, Konrad Urbanski
//////////////////////////////////////////////////////////////////////////////////////
//⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
//                         ⠀⠀⢀⣀⠀⠀⠀⠀⠀⠀
// ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣤⣶⣶⣦⣌⠙⠋⢡⣴⣶⡄⠀⠀
// ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠀⣿⣿⣿⡿⢋⣠⣶⣶⡌⠻⣿⠟⠀⠀
// ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⡆⠸⠟⢁⣴⣿⣿⣿⣿⣿⡦⠉⣴⡇⠀
// ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⣿⠟⠀⠰⣿⣿⣿⣿⣿⣿⠟⣠⡄⠹⠀⠀
// ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⢸⡿⢋⣤⣿⣄⠙⣿⣿⡿⠟⣡⣾⣿⣿⠀⠀⠀
// ⠀⠀⠀⠀⠀⠀⠀⠀⣠⣴⣾⠿⠀⢠⣾⣿⣿⣿⣦⠈⠉⢠⣾⣿⣿⣿⠏⠀⠀⠀
// ⠀⠀⠀⠀⣀⣤⣦⣄⠙⠋⣠⣴⣿⣿⣿⣿⠿⠛⢁⣴⣦⡄⠙⠛⠋⠁⠀⠀⠀⠀
// ⠀⠀⢀⣾⣿⣿⠟⢁⣴⣦⡈⠻⣿⣿⡿⠁⡀⠚⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
// ⠀⠀⠘⣿⠟⢁⣴⣿⣿⣿⣿⣦⡈⠛⢁⣼⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
// ⠀⢰⡦⠀⢴⣿⣿⣿⣿⣿⣿⣿⠟⢀⠘⠿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
// ⠀⠘⢀⣶⡀⠻⣿⣿⣿⣿⡿⠋⣠⣿⣷⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
// ⠀⠀⢿⣿⣿⣦⡈⠻⣿⠟⢁⣼⣿⣿⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
// ⠀⠀⠈⠻⣿⣿⣿⠖⢀⠐⠿⠟⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
// ⠀⠀⠀⠀⠈⠉⠁⠀⠀⠀⠀⠀
//
//////////////////////////////////////////////////////////////////////////////////////

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PrivatePeanut is Ownable {
    // events
    event DepositEvent(uint256 _amount, address indexed _senderAddress);
    event WithdrawEvent(uint256 _amount, address indexed _recipientAddress);
    event MessageEvent(string message);

    bytes[] public signatures; // array of signatures to prevent double spending

    address public TEEAddress; // address of the TEE signer

    constructor(address _TEEAddress) public {
        emit MessageEvent(
            "Hello World, have a nutty day! Private Peanutssssssss w/ IEXEC!"
        );
        TEEAddress = _TEEAddress;
    }

    /**
     * @notice Simple payable function to deposit funds into the smart contract.
     * @dev All the complexity happens in the TEE
     */
    function deposit() external payable {
        emit DepositEvent(msg.value, msg.sender);
    }

    /**
     * @notice Function to withdraw from the smart contract. Requires a valid TEE signed voucher.
     * @dev The signature should be signed with the private key corresponding of the TEE public key.
     * @param _recipientAddress address of the recipient we want to withdraw to
     * @param _amount amount to withdraw
     * @param _voucherId the voucher id
     * @param _messageHash the message hash of the voucher params (just amount in this case)
     * @param _signature a valid TEE signature of the voucher params (just amount in this case)
     * @return bool true if successful
     */
    function withdraw(
        address _recipientAddress,
        uint256 _amount,
        uint256 _voucherId,
        bytes32 _messageHash,
        bytes memory _signature
    ) external returns (bool) {

        // Ensure the signature has not been previously used
        // TODO: merkle tree
        for (uint256 i = 0; i < signatures.length; i++) {
            if (keccak256(_signature) == keccak256(signatures[i])) {
                revert("SIGNATURE ALREADY USED");
            }
        }

        // Check that hash(voucherId, amount) == messageHash
        bytes32 voucherHash = keccak256(abi.encodePacked(_voucherId, _amount));
        require(voucherHash == _messageHash, "INVALID VOUCHER HASH");

        // Check that the signature is valid (signed by the TEE)
        address voucherSigner = getSigner(_messageHash, _signature);
        require(voucherSigner == TEEAddress, "INVALID SIGNATURE");

        payable(_recipientAddress).transfer(_amount);

        // add the signature to the array of signatures
        signatures.push(_signature);

        // emit the withdraw event
        emit WithdrawEvent(_amount, _recipientAddress);

        return true;
    }

    /**
     * @notice Gets the signer of a messageHash. Used for signature verification.
     * @dev Uses ECDSA.recover. On Frontend, use secp256k1 to sign the messageHash
     * @dev also remember to prepend the messageHash with "\x19Ethereum Signed Message:\n32"
     * @param messageHash bytes32 hash of the message
     * @param signature bytes signature of the message
     * @return address of the signer
     */
    function getSigner(bytes32 messageHash, bytes memory signature)
        internal
        pure
        returns (address)
    {
        address signer = ECDSA.recover(messageHash, signature);
        return signer;
    }

    /**
     * @notice Function to set the TEE address. Only the owner can call this function.
     * @param _TEEAddress address of the TEE signer
     */
    function setTEEAddress(address _TEEAddress) external onlyOwner {
        TEEAddress = _TEEAddress;
    }
}
