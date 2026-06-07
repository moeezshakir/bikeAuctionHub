<?php
// get_wallet_balance.php

header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header('Content-Type: application/json');

require_once './db_config.php'; // Adjust the path as needed

// Handle request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get data from the request
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    $user_id = $data['user_id'];

    try {
        // Connect to the database using PDO
        $pdo = new PDO("mysql:host=" . DB_SERVER . ";dbname=" . DB_DATABASE, DB_USERNAME, DB_PASSWORD);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Check if user ID exists in wallet table
        $checkStmt = $pdo->prepare("SELECT remainingBalance FROM wallet WHERE userId = ?");
        $checkStmt->execute([$user_id]);
        $wallet = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if ($wallet) {
            // User ID exists, get remaining balance
            $remainingBalance = $wallet['remainingBalance'];
        } else {
            // User ID does not exist, insert new entry with remaining balance of 0
            $insertStmt = $pdo->prepare("INSERT INTO wallet (userId, remainingBalance) VALUES (?, 0)");
            $insertStmt->execute([$user_id]);

            $remainingBalance = 0;
        }

        // Prepare response with remaining balance
        $response = [
            'status' => true,
            'data' => [
                'user_id' => $user_id,
                'remainingBalance' => $remainingBalance
            ]
        ];
    } catch (PDOException $e) {
        // Log PDO exceptions for debugging
        error_log('PDOException: ' . $e->getMessage());
        $response = [
            'status' => false,
            'error' => 'Database error'
        ];
    } catch (Exception $e) {
        // Log other exceptions for debugging
        error_log('Exception: ' . $e->getMessage());
        $response = [
            'status' => false,
            'error' => 'An unexpected error occurred'
        ];
    }

    // Send JSON response
    echo json_encode($response);
    exit; // Ensure script terminates after sending response
}
