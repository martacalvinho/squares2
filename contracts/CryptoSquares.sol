// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CryptoSquares {
    struct Spot {
        uint256 currentBid;
        address currentBidder;
        string projectName;
        string projectLink;
        string projectLogo;
    }

    mapping(uint256 => Spot) public spots;
    uint256 public constant TOTAL_SPOTS = 500;
    uint256 public constant MIN_BID_INCREMENT = 0.01 ether;

    event BidPlaced(
        uint256 indexed spotId,
        address indexed bidder,
        uint256 amount,
        string projectName,
        string projectLink,
        string projectLogo
    );

    function placeBid(
        uint256 spotId,
        string memory projectName,
        string memory projectLink,
        string memory projectLogo
    ) external payable {
        require(spotId < TOTAL_SPOTS, "Invalid spot ID");
        require(msg.value > spots[spotId].currentBid + MIN_BID_INCREMENT, "Bid too low");

        // Refund previous bidder if exists
        if (spots[spotId].currentBidder != address(0)) {
            payable(spots[spotId].currentBidder).transfer(spots[spotId].currentBid);
        }

        // Update spot information
        spots[spotId] = Spot({
            currentBid: msg.value,
            currentBidder: msg.sender,
            projectName: projectName,
            projectLink: projectLink,
            projectLogo: projectLogo
        });

        emit BidPlaced(spotId, msg.sender, msg.value, projectName, projectLink, projectLogo);
    }

    function getSpot(uint256 spotId) external view returns (
        uint256 currentBid,
        address currentBidder,
        string memory projectName,
        string memory projectLink,
        string memory projectLogo
    ) {
        require(spotId < TOTAL_SPOTS, "Invalid spot ID");
        Spot memory spot = spots[spotId];
        return (
            spot.currentBid,
            spot.currentBidder,
            spot.projectName,
            spot.projectLink,
            spot.projectLogo
        );
    }
}