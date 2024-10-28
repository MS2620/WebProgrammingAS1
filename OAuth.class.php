<?php

require_once('defs.php');

class CurlHandler{
    public $curl;
    public function __construct($url=''){
        $this->curl = curl_init($url);
        curl_setopt($this->curl, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
        curl_setopt($this->curl, CURLOPT_RETURNTRANSFER, TRUE);
        curl_setopt($this->curl, CURLOPT_USERAGENT, $_SERVER['HTTP_USER_AGENT']);
        curl_setopt($this->curl, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
        $this->setPost();
    }

    public function setHeader($header){
        curl_setopt($this->curl, CURLOPT_HTTPHEADER, $header);
    }

    public function setPost($value = true){
        curl_setopt($this->curl, CURLOPT_POST, $value);
    }

    public function setQuery($query = []){
        curl_setopt($this->curl, CURLOPT_POSTFIELDS, http_build_query($query));
    }

    public function runCurl(){
        return curl_exec($this->curl);
    }
}

class OAuth {

    public $providername, $authURL, $tokenURL, $apiURL, $revokeURL, $scope;
    protected $secret, $cid;

    public function __construct($providerInfo, $cid, $secret) {
        $this->providername = $providerInfo['providername'];
        $this->authURL = $providerInfo['data']['authURL'];
        $this->tokenURL = $providerInfo['data']['tokenURL'];
        $this->apiURL = $providerInfo['data']['apiURL'];
        $this->revokeURL = $providerInfo['data']['revokeURL'];
        $this->scope = $providerInfo['data']['scope'];
        $this->cid = $cid;
        $this->secret = $secret;
    }

    public function getAuth($code){
        $curl = new CurlHandler($this->tokenURL);
        $headers[] = 'Accept: application/json';
        $curl->setHeader($headers);
        $params = array(
            'grant_type' => 'authorization_code',
            'client_id' => $this->cid,
            'client_secret' => $this->secret,
            'redirect_uri' => REDIRECT_TOKEN_URI,
            'code' => $code,
        );
        $curl->setQuery($params);
        $result = json_decode($curl->runCurl());
        return $result;
    }

    public function getAuthConfirm($token){
        $curl = new CurlHandler($this->apiURL);
        $curl->setPost(false);
        $headers[] = 'Accept: application/json';
        $headers[] = 'Authorization: Bearer '.$token;
        $curl->setHeader($headers);
        $result = json_decode($curl->runCurl());
        $this->userinfo=$result;
    }

    public function login() {
        $params = array(
            'client_id' => $this->cid,
            'redirect_uri' => REDIRECT_URI,
            'response_type' => 'code',
            'scope' => $this->scope
        );
            
        header('Location: '.$this->authURL.'?'.http_build_query($params));
        die();
    }

    public function generateLoginText(){
        return '<button class="btn"><a href="?action=login&provider='.$this->providername.'">Login with '.$this->providername.'</a></button>';
    }

    public function getName(){
        return $this->userinfo->username;
    }

    public function getAvatar(){
        return 'https://cdn.discordapp.com/avatars/'.$this->getUserId().'/'.$this->userinfo->avatar.'.png';
    }

    public function getUserId(){
        return $this->userinfo->id;
    }

    public function storeUserInDatabase() {
        $db = getDatabaseConnection();
        if ($db->connect_error) {
            die("Connection failed: " . $db->connect_error);
        }

        // Extract user data
        $userId = $this->getUserId();
        $username = $this->getName();
        $avatar = $this->getAvatar();

        // Check if user already exists
        $query = $db->prepare("SELECT * FROM users WHERE user_id = ?");
        $query->bind_param('s', $userId);
        $query->execute();
        $result = $query->get_result();

        if ($result->num_rows > 0) {
            // User exists; update information
            $stmt = $db->prepare("UPDATE users SET username = ?, avatar = ? WHERE user_id = ?");
            $stmt->bind_param('sss', $username, $avatar, $userId);
        } else {
            // New user; insert into the database
            $stmt = $db->prepare("INSERT INTO users (user_id, username, avatar) VALUES (?, ?, ?)");
            $stmt->bind_param('sss', $userId, $username, $avatar);
        }
        
        $stmt->execute();
        $stmt->close();
        $db->close();
    }
}

class OAuthGithub extends OAuth{

    public function getName(){
        return $this->userinfo->login;
    }

    public function getAvatar(){
        return 'https://avatars.githubusercontent.com/u/'.$this->getUserId().'?v=4';
    }

}

class ProviderHandler {
    public $providerList = [];
    public $action, $activeProvider, $code, $access_token, $status;
    public $providerInstance;

    public function __construct() {
        if(session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }

        $this->action = $this->getGetParam('action');

        if($this->getGetParam('provider')) {
            $this->activeProvider = $this->getGetParam('provider');
        } else {
            $this->activeProvider = $this->getSessionValue('provider');
        }

        $this->code = $this->getGetParam('code');
        $this->access_token = $this->getSessionValue('access_token');
    }

    public function login() {
        $this->setSessionValue('provider', $this->providerInstance->providername);
        $this->status = 'Logged in';
        $this->providerInstance->login();
    }

    public function logout() {
        echo 'Logging out with '.$this->activeProvider;

        $this->status = 'Logged out';
        session_unset();
        header('Location: '.$_SERVER['PHP_SELF']);
        die();
    }

    public function generateLogout(){
        return '<button class="btn"><a href="?action=logout">Logout</a></button>';
    }

    public function performAction(){
        foreach($this->providerList as $provider) {
            if ($provider->providername == $this->activeProvider) {
                $this->providerInstance = $provider;
                if ($this->action == 'login') {
                    $this->login($provider);
                } else if ($this->action == 'logout') {
                    $this->logout($provider);
                } else if ($this->getSessionValue('access_token')) {
                    $this->processToken();
                } else if($this->code) {
                    $this->processCode();
                }
            }
        }
    }

    public function processCode(){
        $result = $this->providerInstance->getAuth($this->code);
        if($result->access_token){
            $this->status='Logged in';
            $this->setSessionValue('access_token', $result->access_token);
            $this->processToken();
        }
    }

    public function processToken(){
        $this->status='Logged in';
        $this->providerInstance->getAuthConfirm($this->getSessionValue('access_token'));
        $this->providerInstance->storeUserInDatabase();
    }

    public function addProvider($name, $cid, $secret) {
        $providerInfo = $this->getProviderData($name);
        if ($providerInfo !== null) {
            array_push($this->providerList, new $providerInfo['data']['class']($providerInfo,$cid,$secret));
        }
    }

    public function getProviderData($name) {
        foreach (PROVIDERLIST as $provider) {
            if ($provider['providername'] == $name) {
                return $provider;
            }
        }
        return null;
    }

    public function generateLoginText(){
        $result = '';
        foreach($this->providerList as $provider) {
            $result.=$provider->generateLoginText();
        }
        return $result;
    }

    public function getGetParam($key, $default = null) {
        return array_key_exists($key, $_GET) ? $_GET[$key] : $default;
    }

    public function getSessionValue($key, $default = null) {
        return array_key_exists($key, $_SESSION) ? $_SESSION[$key] : $default;
    }

    public function setSessionValue($key, $value) {
        $_SESSION[$key] = $value;
    }
}

?>