<?php
// fetch_rental_details.php

header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header('Content-Type: application/json');

require_once './db_config.php'; // Adjust the path as needed

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    exit;
}

// Handle POST request to fetch rental details for a specific user ID
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get data from the request
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    // Check if user_id is provided in the request data
    if (!isset($data['user_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID is missing']);
        exit;
    }

    $userId = $data['user_id'];

    try {
        // Connect to the database using PDO
        $pdo = new PDO("mysql:host=" . DB_SERVER . ";dbname=" . DB_DATABASE, DB_USERNAME, DB_PASSWORD);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Fetch rental details for the specified user ID
        $stmt = $pdo->prepare("
            SELECT user_id, store_id, bike_id, bike_type, start_time, end_time, location, status
            FROM BikeRentals
            WHERE user_id = :user_id
            ORDER BY start_time DESC
        ");
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        // Initialize array to store rental details
        $rentals = [];

        // Fetch rental details
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $rentals[] = [
                'user_id' => $row['user_id'],
                'store_id' => $row['store_id'],
                'bike_id' => $row['bike_id'],
                'bike_type' => $row['bike_type'],
                'start_time' => $row['start_time'],
                'end_time' => $row['end_time'],
                'location' => $row['location'],
                'status' => $row['status']
            ];
        }

        // Prepare response
        if (!empty($rentals)) {
            $response = [
                'status' => true,
                'data' => $rentals
            ];
        } else {
            $response = [
                'status' => false,
                'error' => 'No rental details found for the specified user ID'
            ];
        }
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
} else {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}
