<?php
header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header('Content-Type: application/json');

require_once './db_config.php'; // Adjust the path as needed

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', 'php-error.log');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    exit;
}

// Handle POST requests
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);

        // Validate and sanitize input (not shown for brevity)
        $user_id = $data['userId'];
        $bike_id = $data['bikeId'];
        $duration = $data['duration'];
        $location = $data['location'];
        $start_time = $data['startTime'];

        // Connect to the database using PDO
        $pdo = new PDO("mysql:host=" . DB_SERVER . ";dbname=" . DB_DATABASE, DB_USERNAME, DB_PASSWORD);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Fetch bike details to calculate total price and store ID
        $stmt = $pdo->prepare("SELECT pricePerHour, store_id FROM bikes_data WHERE id = ?");
        $stmt->execute([$bike_id]);
        $bike = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$bike) {
            http_response_code(404);
            echo json_encode(['message' => 'Bike not found']);
            exit;
        }

        $store_id = $bike['store_id'];

        // Calculate total price
        $totalPrice = $bike['pricePerHour'] * $duration;

        // Check if the user has sufficient balance
        $walletStmt = $pdo->prepare("SELECT remainingBalance FROM wallet WHERE userId = ?");
        $walletStmt->execute([$user_id]);
        $wallet = $walletStmt->fetch(PDO::FETCH_ASSOC);

        if (!$wallet || $wallet['remainingBalance'] < $totalPrice) {
            http_response_code(400);
            echo json_encode(['message' => 'Insufficient balance', 'totalPrice' => $totalPrice]);
            exit;
        }

        // Deduct the total price from the user's balance
        $newBalance = $wallet['remainingBalance'] - $totalPrice;
        $updateWalletStmt = $pdo->prepare("UPDATE wallet SET remainingBalance = ? WHERE userId = ?");
        $updateWalletStmt->execute([$newBalance, $user_id]);

        // Insert the booking into the booked_bikes table
        $endTime = date('Y-m-d H:i:s', strtotime("+$duration hours", strtotime($start_time)));
        $bookingStmt = $pdo->prepare("
            INSERT INTO booked_bikes (userId, bikeId, location, startTime, endTime, status)
            VALUES (?, ?, ?, ?, ?, 'booked')
        ");
        $bookingStmt->execute([$user_id, $bike_id, $location, $start_time, $endTime]);

        // Update the bike's booking status
        $updateBikeStmt = $pdo->prepare("UPDATE bikes_data SET bikeBookingStatus = 'booked' WHERE id = ?");
        $updateBikeStmt->execute([$bike_id]);

        // Update rental_stores table: decrease bikeleft by 1
        $updateStoreStmt = $pdo->prepare("UPDATE rental_stores SET bikeleft = bikeleft - 1 WHERE _id = ?");
        $updateStoreStmt->execute([$store_id]);

        echo json_encode(['message' => 'Bike booked successfully', 'totalPrice' => $totalPrice]);
    } catch (PDOException $e) {
        error_log('PDOException: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'Failed to book bike']);
    } catch (Exception $e) {
        error_log('Exception: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'An unexpected error occurred']);
    }
} else {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
}
