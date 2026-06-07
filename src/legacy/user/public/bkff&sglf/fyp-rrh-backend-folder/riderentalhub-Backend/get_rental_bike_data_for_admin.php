<?php
header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header('Content-Type: application/json');

require_once './db_config.php'; // Adjust the path as needed

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', 'php-error.log');


if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    try {
        // Assuming you receive storeId from the frontend
        $storeId = $_GET['storeId'];

        // Connect to the database using PDO
        $pdo = new PDO("mysql:host=" . DB_SERVER . ";dbname=" . DB_DATABASE, DB_USERNAME, DB_PASSWORD);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Fetch bike details by store ID
        $stmt = $pdo->prepare("
            SELECT bd.*, bb.userId, bb.bikeId, bb.location, bb.startTime, bb.endTime, bb.status AS bookingStatus
            FROM bikes_data bd
            LEFT JOIN booked_bikes bb ON bd.id = bb.bikeId
            WHERE bd.store_id = ?
        ");
        $stmt->execute([$storeId]);
        $bikes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Prepare response data
        $response = [];
        foreach ($bikes as $bike) {
            $bikeInfo = [
                'id' => $bike['id'],
                'store_id' => $bike['store_id'],
                'type' => $bike['type'],
                'imageUrl' => $bike['imageUrl'],
                'pricePerHour' => $bike['pricePerHour'],
                'bikeBookingStatus' => $bike['bikeBookingStatus']
            ];

            if ($bike['userId']) {
                $bikeInfo['booking'] = [
                    'userId' => $bike['userId'],
                    'bikeId' => $bike['bikeId'],
                    'location' => $bike['location'],
                    'startTime' => $bike['startTime'],
                    'endTime' => $bike['endTime'],
                    'bookingStatus' => $bike['bookingStatus']
                ];
            }

            $response[] = $bikeInfo;
        }

        echo json_encode(['status' => true, 'data' => $response]);
    } catch (PDOException $e) {
        error_log('PDOException: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['status' => false, 'error' => 'Failed to fetch bike details']);
    } catch (Exception $e) {
        error_log('Exception: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['status' => false, 'error' => 'An unexpected error occurred']);
    }
} else {
    http_response_code(405);
    echo json_encode(['status' => false, 'error' => 'Method not allowed']);
}
