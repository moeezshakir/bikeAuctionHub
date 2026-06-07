-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 17, 2024 at 11:27 AM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `if0_36679809_ridehub`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`id`, `store_id`, `name`, `email`, `password`) VALUES
(1, 1, 'Admin', 'Admin123@example.com', '12345678');

-- --------------------------------------------------------

--
-- Table structure for table `awards`
--

CREATE TABLE `awards` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bikerentals`
--

CREATE TABLE `bikerentals` (
  `user_id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `bike_id` int(11) NOT NULL,
  `bike_type` varchar(50) DEFAULT NULL,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bikerentals`
--

INSERT INTO `bikerentals` (`user_id`, `store_id`, `bike_id`, `bike_type`, `start_time`, `end_time`, `location`, `status`) VALUES
(28, 1, 1, 'Mountain Bike', '2024-07-05 11:33:00', '2024-07-05 01:33:00', 'Gulberg Lahore', 'Complete');

-- --------------------------------------------------------

--
-- Table structure for table `bikes_data`
--

CREATE TABLE `bikes_data` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `store_id` int(11) DEFAULT NULL,
  `type` text DEFAULT NULL,
  `imageUrl` text DEFAULT NULL,
  `pricePerHour` decimal(10,2) DEFAULT NULL,
  `bikeBookingStatus` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bikes_data`
--

INSERT INTO `bikes_data` (`id`, `store_id`, `type`, `imageUrl`, `pricePerHour`, `bikeBookingStatus`) VALUES
(1, 1, 'Road Bike', 'storeBikesImages/b_img-ft -1.jpg', 150.00, 'available'),
(2, 1, 'Road Bike', 'storeBikesImages/b_img-ft -2.jpg', 150.00, 'available\r\n'),
(3, 1, 'Road Bike', 'storeBikesImages/b_img-ft -3.jpg', 150.00, 'available\r\n'),
(4, 1, 'Road Bike', 'storeBikesImages/b_img-ft -4.jpg', 150.00, 'available\r\n'),
(5, 1, 'Road Bike', 'storeBikesImages/b_img-ft -1.jpg', 150.00, 'available\r\n'),
(6, 1, 'Road Bike', 'storeBikesImages/b_img-ft -5.jpg', 150.00, 'available\r\n'),
(13, 3, 'Mountain Bike', 'b_img-ft -4.jpg', 120.00, 'available'),
(14, 3, 'Road Bike', 'b_img-ft -5.jpg', 150.00, 'available'),
(15, 3, 'City Bike', 'b_img-ft -1.jpg', 110.00, 'available'),
(16, 3, 'BMX Bike', 'default_bmx_bike.jpg', 130.00, 'available'),
(17, 3, 'Electric Bike', 'default_electric_bike.jpg', 200.00, 'available'),
(18, 3, 'Cruiser Bike', 'default_cruiser_bike.jpg', 180.00, 'available'),
(23, 1, 'Road Bike', 'storeBikesImages/b_img-ft -3.jpg', 150.00, 'available\r\n');

-- --------------------------------------------------------

--
-- Table structure for table `booked_bikes`
--

CREATE TABLE `booked_bikes` (
  `id` int(11) NOT NULL,
  `userId` int(11) DEFAULT NULL,
  `bikeId` int(11) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `startTime` datetime DEFAULT NULL,
  `endTime` datetime DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `otp_verification`
--

CREATE TABLE `otp_verification` (
  `user_id` int(11) NOT NULL,
  `otp` varchar(10) NOT NULL,
  `expiration_time` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `otp_verification`
--

INSERT INTO `otp_verification` (`user_id`, `otp`, `expiration_time`) VALUES
(28, '57107', '2024-07-16 20:45:18'),
(45, '18163', '2024-07-16 21:14:45');

-- --------------------------------------------------------

--
-- Table structure for table `rental_stores`
--

CREATE TABLE `rental_stores` (
  `_id` int(11) NOT NULL,
  `location` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`location`)),
  `image` text DEFAULT NULL,
  `bikeleft` int(11) DEFAULT NULL,
  `types_of_bike` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`types_of_bike`)),
  `status` text DEFAULT NULL,
  `storeName` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rental_stores`
--

INSERT INTO `rental_stores` (`_id`, `location`, `image`, `bikeleft`, `types_of_bike`, `status`, `storeName`) VALUES
(1, '{\"latitude\": 31.5502, \"longitude\": 74.3436, \"address\": \"address 1\", \"city\": \"Lahore\"}', '', 7, '[\"Mountain Bike\", \"Road Bike\"]', 'Open', 'store 1'),
(3, '{\"latitude\": 31.552, \"longitude\": 74.345, \"address\": \"address 3\", \"city\": \"Lahore\"}', '', 0, '[\"Electric Bike\", \"Folding Bike\"]', 'Open', 'store 3');

-- --------------------------------------------------------

--
-- Table structure for table `report_issues`
--

CREATE TABLE `report_issues` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `submit_time` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `report_issues`
--

INSERT INTO `report_issues` (`id`, `user_id`, `title`, `description`, `submit_time`) VALUES
(1, 28, 'testing', 'qwerty12345', '2024-06-25 18:37:45'),
(2, 28, 'testing', 'qwertyuiop', '2024-06-25 18:39:22'),
(3, 28, 'testing', 'qwertyuiop', '2024-06-25 18:39:48'),
(4, 28, 'error', '1234567890', '2024-07-02 05:56:04'),
(5, 28, 'new issue', 'checking, it is working or not', '2024-07-15 13:30:55');

-- --------------------------------------------------------

--
-- Table structure for table `ride_places`
--

CREATE TABLE `ride_places` (
  `store_id` int(11) DEFAULT NULL,
  `location_1` varchar(255) DEFAULT NULL,
  `location_2` varchar(255) DEFAULT NULL,
  `location_3` varchar(255) DEFAULT NULL,
  `location_4` varchar(255) DEFAULT NULL,
  `location_5` varchar(255) DEFAULT NULL,
  `location_6` varchar(255) DEFAULT NULL,
  `location_7` varchar(255) DEFAULT NULL,
  `location_8` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ride_places`
--

INSERT INTO `ride_places` (`store_id`, `location_1`, `location_2`, `location_3`, `location_4`, `location_5`, `location_6`, `location_7`, `location_8`) VALUES
(1, 'Badshahi Mosque', 'Lahore Fort', 'Shalimar Gardens', 'Anarkali Bazaar', 'Minar-e-Pakistan', 'Wagah Border', 'The Mall Road', 'Gaddafi Stadium');

-- --------------------------------------------------------

--
-- Table structure for table `rrh_login_users`
--

CREATE TABLE `rrh_login_users` (
  `email` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rrh_registered_user`
--

CREATE TABLE `rrh_registered_user` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rrh_registered_user`
--

INSERT INTO `rrh_registered_user` (`id`, `username`, `email`, `password`) VALUES
(28, 'test1', 'test1@gmail.com', '$2y$10$IJ9VcZFVA.YjELA8fijyk.RPWU6Ek41ELG1fhDBYmViSKZqq/c.gC'),
(45, 'Moeez', 'mooezshakir56@gmail.com', '$2y$10$knFN/uZGaYrPvUTxdtxBm.ridvSn3RSxoC75Y/LgALehBWk.24S7S');

-- --------------------------------------------------------

--
-- Table structure for table `rrh_user`
--

CREATE TABLE `rrh_user` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `nationality` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `languages` varchar(255) DEFAULT NULL,
  `cnic_no` varchar(20) DEFAULT NULL,
  `account_verified_status` tinyint(1) DEFAULT 0,
  `profile_pic` varchar(255) DEFAULT NULL,
  `profile_pic_path` varchar(255) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `rrh_user`
--

INSERT INTO `rrh_user` (`id`, `name`, `email`, `phone_number`, `address`, `nationality`, `country`, `languages`, `cnic_no`, `account_verified_status`, `profile_pic`, `profile_pic_path`) VALUES
(28, 'test1', 'test1@gmail.com', '123-456-7890', '123 Main St, Cityvilleer', 'Pakistan', NULL, 'English, Urdu', NULL, 1, 'uploads/bikeImage.jpg', NULL),
(45, 'Moeez', 'mooezshakir56@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `rrh_user_requiredinfo`
--

CREATE TABLE `rrh_user_requiredinfo` (
  `userId` int(11) NOT NULL,
  `cnic` varchar(15) DEFAULT NULL,
  `recoveryEmail` varchar(255) DEFAULT NULL,
  `recoveryPhoneNumber` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rrh_user_requiredinfo`
--

INSERT INTO `rrh_user_requiredinfo` (`userId`, `cnic`, `recoveryEmail`, `recoveryPhoneNumber`) VALUES
(28, '1034564', 'test1@gmail.com', '084806');

-- --------------------------------------------------------

--
-- Table structure for table `social_links`
--

CREATE TABLE `social_links` (
  `user_id` int(11) NOT NULL,
  `facebook` varchar(255) DEFAULT NULL,
  `instagram` varchar(255) DEFAULT NULL,
  `linkedin` varchar(255) DEFAULT NULL,
  `youtube` varchar(255) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `social_links`
--

INSERT INTO `social_links` (`user_id`, `facebook`, `instagram`, `linkedin`, `youtube`) VALUES
(28, 'www.facebook.com', 'www.instagram.com', 'www.linkedIn.com', 'www.youtube.com');

-- --------------------------------------------------------

--
-- Table structure for table `user_awards`
--

CREATE TABLE `user_awards` (
  `user_id` int(11) NOT NULL,
  `award_id` int(11) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `wallet`
--

CREATE TABLE `wallet` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `remainingBalance` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `wallet`
--

INSERT INTO `wallet` (`id`, `userId`, `remainingBalance`) VALUES
(1, 28, 3110.00),
(2, 45, 0.00);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `awards`
--
ALTER TABLE `awards`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `bikerentals`
--
ALTER TABLE `bikerentals`
  ADD PRIMARY KEY (`user_id`,`store_id`,`bike_id`);

--
-- Indexes for table `bikes_data`
--
ALTER TABLE `bikes_data`
  ADD PRIMARY KEY (`id`),
  ADD KEY `store_id` (`store_id`);

--
-- Indexes for table `booked_bikes`
--
ALTER TABLE `booked_bikes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `otp_verification`
--
ALTER TABLE `otp_verification`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `rental_stores`
--
ALTER TABLE `rental_stores`
  ADD PRIMARY KEY (`_id`);

--
-- Indexes for table `report_issues`
--
ALTER TABLE `report_issues`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `rrh_login_users`
--
ALTER TABLE `rrh_login_users`
  ADD PRIMARY KEY (`email`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `rrh_registered_user`
--
ALTER TABLE `rrh_registered_user`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `rrh_user`
--
ALTER TABLE `rrh_user`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `rrh_user_requiredinfo`
--
ALTER TABLE `rrh_user_requiredinfo`
  ADD PRIMARY KEY (`userId`);

--
-- Indexes for table `social_links`
--
ALTER TABLE `social_links`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `user_awards`
--
ALTER TABLE `user_awards`
  ADD PRIMARY KEY (`user_id`,`award_id`),
  ADD KEY `award_id` (`award_id`);

--
-- Indexes for table `wallet`
--
ALTER TABLE `wallet`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `awards`
--
ALTER TABLE `awards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bikes_data`
--
ALTER TABLE `bikes_data`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `booked_bikes`
--
ALTER TABLE `booked_bikes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `report_issues`
--
ALTER TABLE `report_issues`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `rrh_registered_user`
--
ALTER TABLE `rrh_registered_user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `rrh_user`
--
ALTER TABLE `rrh_user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `wallet`
--
ALTER TABLE `wallet`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bikes_data`
--
ALTER TABLE `bikes_data`
  ADD CONSTRAINT `bikes_data_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `rental_stores` (`_id`);

--
-- Constraints for table `rrh_login_users`
--
ALTER TABLE `rrh_login_users`
  ADD CONSTRAINT `rrh_login_users_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `rrh_registered_user` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
