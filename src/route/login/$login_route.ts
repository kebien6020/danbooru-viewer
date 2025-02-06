import { Booru } from "../../structure/Booru"
import { ClientUser } from "../../structure/ClientUser";

export const $login_route = $('route').path('/login').builder(({$page}) => {
    const [username$, apiKey$] = [$.state(''), $.state('')]
    return $page.id('login').content([
        $('div').class('login-container').content([
            $('h1').content('Login'),
            $('div').class('username', 'input-container').content([
                $('label').for('username').content('Username'),
                $('input').type('text').id('username').value(username$)
            ]),
            $('div').class('api-key', 'input-container').content([
                $('label').for('api-key').content('API Key'),
                $('input').type('password').id('api-key').value(apiKey$)
            ]),
            $('icon-button').content('Login').on('click', async () => { 
                await Booru.used.login(username$.value, apiKey$.value);
                if (Booru.used.user) { 
                    ClientUser.storageUserData = { apiKey: apiKey$.value, username: username$.value }
                    // Clear input
                    username$.set('');
                    apiKey$.set('');
                    $.replace('/');
                };
            }),
            $('icon-button').content('Create Account').icon('open-outline').on('click', () => $.open('https://danbooru.donmai.us/users/new', '_blank')),
        ])
    ])
})