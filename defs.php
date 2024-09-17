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
            'authURL' => '',
            'tokenURL' => '',
            'apiURL' => '',
            'revokeURL' => '',
            'scope' => '',
            'class' => 'OAuth'
        ]
    ],
    [
        'providername' => 'Reddit',
        'data' => [
            'authURL' => '',
            'tokenURL' => '',
            'apiURL' => '',
            'revokeURL' => '',
            'scope' => '',
            'class' => 'OAuth'
        ]
    ]
)


// https://discord.com/oauth2/authorize?client_id=1285552942065389618&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%2F&scope=identify

?>