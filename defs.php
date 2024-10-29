<?php
define('DB_HOST', 'comp-server.uhi.ac.uk');
define('DB_USER', 'sql08013495');
define('DB_PASS', 'sql08013495');
define('DB_NAME', 'sql08013495');

function getDatabaseConnection()
{
    return new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
}

define('REDIRECT_URI', 'https://comp-server.uhi.ac.uk/~08013495/WebProgramming/');
define('REDIRECT_TOKEN_URI', 'https://comp-server.uhi.ac.uk/~08013495/WebProgramming/');

const PROVIDERLIST = array(
    [
        'providername' => 'Discord',
        'data' => [
            'authURL' => 'https://discord.com/oauth2/authorize',
            'tokenURL' => 'https://discord.com/api/oauth2/token',
            'apiURL' => 'https://discord.com/api/users/@me',
            'revokeURL' => 'https://discord.com/api/oauth2/token/revoke',
            'scope' => 'identify',
            'class' => 'OAuth',
        ],
    ],
    [
        'providername' => 'Github',
        'data' => [
            'authURL' => 'https://github.com/login/oauth/authorize',
            'tokenURL' => 'https://github.com/login/oauth/access_token',
            'apiURL' => 'https://api.github.com/user',
            'revokeURL' => 'https://github.com/application/########/grant',
            'scope' => 'user',
            'class' => 'OAuthGithub',
        ],
    ],
)

?>
