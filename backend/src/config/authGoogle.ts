import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { pool } from "../plugins/pg";
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const google_id = profile.id;
        const email = profile.emails?.[0]?.value;
        const avatar = profile.photos?.[0]?.value;
        const name = profile.displayName;
        // google has in db
        const googleExist = await pool.query(
          `
        select * from users
        where google_id = $1`,
          [google_id],
        );
        if (googleExist.rows[0]) {
          const updatedUser = await pool.query(
            `
            update users
            set google_access = $1, google_refresh = $2
            where google_id = $3
            returning *`,
            [accessToken, refreshToken, google_id],
          );
          return done(null, updatedUser.rows[0]);
        }
        //email  has in db

        const emailExist = await pool.query(
          `
        select * from users
        where email = $1`,
          [email],
        );

        if (emailExist.rows[0]) {
          const updatedUser = await pool.query(
            `
            update users
            set avatar = $1, google_id = $2, name = $3, google_access = $4, google_refresh = $5
            where id =$6
            returning * `,
            [avatar, google_id, name, accessToken, refreshToken, emailExist.rows[0].id],
          );
          return done(null, updatedUser.rows[0]);
        }
        //create account
        const newUser = await pool.query(
          `
        insert into users
        (name, avatar, email, google_id, google_access, google_refresh)
        values($1, $2, $3, $4, $5, $6)
        returning *`,
          [name, avatar, email, google_id, accessToken, refreshToken],
        );
        return done(null, newUser.rows[0]);
      } catch (error) {
        return done(error as Error, false);
      }
    },
  ),
);
