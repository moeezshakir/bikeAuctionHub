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

// Handle GET request to fetch user profile data
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get user_id from the request (assuming it's passed as a query parameter)
    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

    if ($user_id > 0) {
        try {
            // Connect to the database using PDO
            $pdo = new PDO("mysql:host=" . DB_SERVER . ";dbname=" . DB_DATABASE, DB_USERNAME, DB_PASSWORD);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            // Fetch user details from rrh_user table
            $userStmt = $pdo->prepare("SELECT name, email, phone_number, address, nationality, languages, profile_pic FROM rrh_user WHERE id = ?");
            $userStmt->execute([$user_id]);
            $user = $userStmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                // Fetch social links
                $socialLinksStmt = $pdo->prepare("SELECT facebook, instagram, linkedin, youtube FROM social_links WHERE user_id = ?");
                $socialLinksStmt->execute([$user_id]);
                $socialLinks = $socialLinksStmt->fetch(PDO::FETCH_ASSOC);

                // Fetch user awards
                $awardsStmt = $pdo->prepare("SELECT a.title, a.description, a.image FROM user_awards ua JOIN awards a ON ua.award_id = a.id WHERE ua.user_id = ?");
                $awardsStmt->execute([$user_id]);
                $awards = $awardsStmt->fetchAll(PDO::FETCH_ASSOC);

                // Prepare user profile data
                $userProfileData = [
                    'name' => $user['name'],
                    'image' => $user['profile_pic'],
                    'email' => $user['email'],
                    'phoneNumber' => $user['phone_number'],
                    'address' => $user['address'],
                    'nationality' => $user['nationality'],
                    'languages' => $user['languages'],
                    'socialLinks' => $socialLinks ? $socialLinks : null,
                    'awards' => $awards ? $awards : []
                ];

                $response = [
                    'status' => true,
                    'data' => $userProfileData
                ];
            } else {
                // User not found
                $response = [
                    'status' => false,
                    'error' => 'User not found'
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
    } else {
        // Invalid user_id
        $response = [
            'status' => false,
            'error' => 'Invalid user ID'
        ];
    }

    // Send JSON response
    echo json_encode($response);
    exit; // Ensure script terminates after sending response
}
