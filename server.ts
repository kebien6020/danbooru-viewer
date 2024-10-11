import cors from "@elysiajs/cors";
import Elysia from "elysia";
const app = new Elysia()
    .use(cors())
    .get('*', async ({path}) => {
        return Bun.file('./dist/index.html')
    })
    .get('/assets/*', (res) => {
        return Bun.file(`./dist/${res.path}`)
    })
    .group('/api', app => { return app
        .delete('/favorites/:id', async ({params, query}) => {
            const data = await fetch(`${query.origin}/favorites/${params.id}.json?login=${query.login}&api_key=${query.api_key}`, {method: "DELETE"}).then(res => res.ok);
            console.debug(data)
            return data
        })
    })
    .listen(3030);
console.log('Start listening: 3030')
export type Server = typeof app;