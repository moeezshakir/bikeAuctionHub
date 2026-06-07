<?php
header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header('Content-Type: application/json');

$response = [];

try {
    $pdo = new PDO("mysql:host=localhost;dbname=if0_36679809_ridehub", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!isset($data['name']) || !isset($data['email']) || !isset($data['password'])) {
        $response = ['status' => false, 'error' => 'Invalid form data'];
        echo json_encode($response);
        exit;
    }

    $username = $data['name'];
    $email = $data['email'];
    $password = $data['password'];

    // Check if email exists in the database
    $stmt = $pdo->prepare("SELECT * FROM rrh_registered_user WHERE email = ?");
    $stmt->execute([$email]);
    $existingUser = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existingUser) {
        $response = ['status' => false, 'error' => 'Email already exists'];
        echo json_encode($response);
        exit;
    }

    // Function to verify email using Hunter.io API
    function verifyEmailWithHunter($email)
    {
        $apiKey = getenv('HUNTER_API_KEY');
        if (!$apiKey) {
            return null;
        }
        $url = "https://api.hunter.io/v2/email-verifier?email=" . urlencode($email) . "&api_key=" . $apiKey;

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        $response = curl_exec($ch);
        curl_close($ch);

        return json_decode($response, true);
    }

    // Verify email using Hunter.io
    $verificationResult = verifyEmailWithHunter($email);

    if (!$verificationResult || $verificationResult['data']['status'] != 'valid') {
        $response = ['status' => false, 'error' => 'Email is not valid or not deliverable'];
        echo json_encode($response);
        exit;
    }

    // Generate OTP
    $otp = random_int(10000, 99999);
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Insert into rrh_registered_user table
    $insertStmt = $pdo->prepare("INSERT INTO rrh_registered_user (username, email, password) VALUES (?, ?, ?)");
    $insertStmt->execute([$username, $email, $hashedPassword]);

    // Retrieve the user ID
    $user_id = $pdo->lastInsertId();
    $expiration_time = date('Y-m-d H:i:s', strtotime('+10 minutes'));

    // Insert into otp_verification table
    $otpInsertStmt = $pdo->prepare("INSERT INTO otp_verification (user_id, otp, expiration_time) VALUES (?, ?, ?)");
    $otpInsertStmt->execute([$user_id, $otp, $expiration_time]);

    // Insert into rrh_user table
    $insertUserStmt = $pdo->prepare("INSERT INTO rrh_user (id, name, email) VALUES (?, ?, ?)");
    $insertUserStmt->execute([$user_id, $username, $email]);

    $response = ['status' => true, 'message' => 'Registration successful. Here is your OTP.', 'otp' => $otp, 'uidfr' => $user_id, 'userEmail' => $email];
} catch (PDOException $e) {
    error_log('PDOException: ' . $e->getMessage());
    $response = ['status' => false, 'error' => 'Database error.'];
} catch (Exception $e) {
    error_log('Exception: ' . $e->getMessage());
    $response = ['status' => false, 'error' => 'An unexpected error occurred.'];
}

echo json_encode($response);
