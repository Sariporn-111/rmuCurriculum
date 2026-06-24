import { Elysia } from 'elysia'
import { file } from 'bun'
import { existsSync } from 'fs'
import { cors } from '@elysiajs/cors'
import cookie from '@elysiajs/cookie'
import 'dotenv/config'
import { courseRoute } from './routes/CurriculumRouter.js'
import pool from './config/db.js'
import { authRoute } from './routes/authRoute.js'
import { userRoute } from './routes/userRoute.js'
import { roleRoute } from './routes/roleRoute.js'
import { committeeRoute } from './routes/committeRoute.js'
import { certificationRoute } from './routes/certificationRoute.js'
import path from 'path'
import { smo08Route } from './routes/Smo08route.js'
import { facultyRoute } from './routes/facultyRoute.js'
import { academicCommitteeRoute } from './routes/academicCommitteeRoute.js'
import { curriculumProcessRoute } from './routes/CurriculumProcessRoute.js'
import { staticPlugin } from "@elysiajs/static";
import { officerDashboardRoute } from './routes/Officerdashboardroute.js'
import { degreeTypeRoute } from './routes/degreeTypeRoute.js'
import { reportRoute } from './routes/reportRoute.js'
import { oheTrackingRoute } from './routes/ohetrackingroute.js'
import { meetingRoute } from './routes/meetingRoute.js'

const app = new Elysia()

app
    .use(cors({
        origin: "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }))
    .use(cookie())
    .get('/uploads/*', ({ params }) => {
        const fileName = decodeURIComponent(params['*']) // ✅ decode ก่อน
        const filePath = path.join(process.cwd(), 'uploads', fileName)

        console.log("filePath:", filePath)

        if (!existsSync(filePath)) {
            return new Response('Not found', { status: 404 })
        }
        return new Response(file(filePath))
    })
    .get('/images/*', ({ params }) => {
        const fileName = decodeURIComponent(params['*'])
        const filePath = path.join(process.cwd(), 'images', fileName)
        if (!existsSync(filePath)) {
            return new Response('Not found', { status: 404 })
        }
        return new Response(file(filePath))
    })
    .get('/', () => 'Hello Elysia')
    .use(authRoute)
    .use(courseRoute)
    .use(userRoute)
    .use(roleRoute)
    .use(committeeRoute)
    .use(certificationRoute)
    .use(smo08Route)
    .use(facultyRoute)
    .use(academicCommitteeRoute)
    .use(curriculumProcessRoute)
    .use(officerDashboardRoute)
    .use(degreeTypeRoute)
    .use(reportRoute)
    .use(oheTrackingRoute)
    .use(meetingRoute)

// connect DB
pool.connect()
    .then(() => console.log('DB connected'))
    .catch(err => console.error('DB Error', err))

//  ใช้ app ตัวเดียว
app.listen(3000)

console.log('Server running at http://localhost:3000')

