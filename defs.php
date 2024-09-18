<?php

define('REDIRECT_URI', 'http://localhost/');
define('REDIRECT_TOKEN_URI', 'http://localhost/');

const PROVIDERLIST = array (
    [
        'providername' => 'Discord',
        'data' => [
            'authURL' => 'https://discord.com/oauth2/authorize',
            'tokenURL' => 'https://discord.com/api/oauth2/token',
            'apiURL' => 'https://discord.com/api/users/@me',
            'revokeURL' => 'https://discord.com/api/oauth2/token/revoke',
            'scope' => 'identify',
            'class' => 'OAuth'
        ]
    ],
    [
        'providername' => 'Github',
        'data' => [
            'authURL' => 'https://github.com/login/oauth/authorize',
            'tokenURL' => 'https://github.com/login/oauth/access_token',
            'apiURL' => 'https://api.github.com/user',
            'revokeURL' => 'https://github.com/application/########/grant',
            'scope' => 'user',
            'class' => 'OAuthGithub'
        ]
    ]
)

?>