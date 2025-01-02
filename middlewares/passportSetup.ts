import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { googleLogin } from "../controllers/authController";

// Environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "your-google-client-id";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "your-google-client-secret";

// Passport strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            callbackURL: "/p/api/v1/auth/google-login/callback", // Use relative path for callback
        },
        (accessToken: string, refreshToken: string, profile: Profile, done: Function) => {
            // Save user profile to session or database
            return done(null, profile);
        }
    )
);

// Serialize and deserialize user
passport.serializeUser((user: Express.User, done) => {
    done(null, user);
});

passport.deserializeUser((obj: Express.User, done) => {
    done(null, obj);
});

// Route to initiate Google login
export const initiateGoogleLogin = (req: Request, res: Response, next: NextFunction): void => {
    passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
};

// Route to handle Google callback
export const handleGoogleCallback = (req: Request, res: Response, next: NextFunction): void => {
    passport.authenticate("google", { failureRedirect: "/error" }, async (err, user) => {
        if (err || !user) {
            res.send(
                `<script>
                    window.opener.postMessage(${JSON.stringify({ success: false })}, "*");
                    window.close();
                </script>`
            );
            return;
        }
        try {
            // Generate tokens
            const { access_token, refresh_token } = await googleLogin(user._json);
            // Set tokens as cookies
            res.cookie("access_token", access_token, {
                httpOnly: true,
                secure: true, // Use true in production with HTTPS
                sameSite: "none", // Allow cross-origin requests
            });
            res.cookie("refresh_token", refresh_token, {
                httpOnly: true,
                secure: true, // Use true in production with HTTPS
                sameSite: "none",
            });
            // Notify the parent window
            res.send(
                `<script>
                    window.opener.postMessage(${JSON.stringify({ success: true })}, "*");
                    window.close();
                </script>`
            );
        } catch (error) {
            res.send(
                `<script>
                    window.opener.postMessage(${JSON.stringify({ success: false })}, "*");
                    window.close();
                </script>`
            );
        }
    })(req, res, next);
};

