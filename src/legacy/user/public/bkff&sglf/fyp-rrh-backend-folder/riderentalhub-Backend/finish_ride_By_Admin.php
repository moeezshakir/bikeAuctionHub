<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json');

require_once './db_config.php'; // Adjust the path as needed

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $inputJSON = file_get_contents('php://input');
        $input = json_decode($inputJSON, true);

        if (!isset($input['bikeId'])) {
            throw new Exception('Missing bikeId in request body');
        }

        $bikeId = $input['bikeId'];

        // Connect to the database using PDO
        $pdo = new PDO("mysql:host=" . DB_SERVER . ";dbname=" . DB_DATABASE, DB_USERNAME, DB_PASSWORD);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Start a transaction
        $pdo->beginTransaction();

        // Step 1: Delete booking from booked_bikes
        $stmtDeleteBooking = $pdo->prepare("
            DELETE FROM booked_bikes
            WHERE id = :bikeId
        ");
        $stmtDeleteBooking->execute(['bikeId' => $bikeId]);

        // Step 2: Update bikeBookingStatus in bikes_data to 'available'
        $stmtUpdateBikeStatus = $pdo->prepare("
            UPDATE bikes_data bd
            JOIN booked_bikes bb ON bd.id = bb.bike_id
            SET bd.bikeBookingStatus = 'available'
            WHERE bb.id = :bikeId
        ");
        $stmtUpdateBikeStatus->execute(['bikeId' => $bikeId]);

        // Commit the transaction
        $pdo->commit();

        // Respond with success status
        echo json_encode(['status' => true, 'message' => 'Ride finished successfully']);
    } catch (PDOException $e) {
        // Rollback the transaction on PDO exception
        if (isset($pdo)) {
            $pdo->rollback();
        }

        error_log('PDOException: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['status' => false, 'error' => 'Database error occurred']);
    } catch (Exception $e) {
        // Rollback the transaction on general exception
        if (isset($pdo)) {
            $pdo->rollback();
        }

        error_log('Exception: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['status' => false, 'error' => 'An unexpected error occurred']);
    }
} else {
    http_response_code(405);
    echo json_encode(['status' => false, 'error' => 'Method not allowed']);
}
