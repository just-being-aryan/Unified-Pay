import axios from "axios";
import qs from "querystring";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const FRONTEND_URL = process.env.FRONTEND_URL;

// Create JWT
const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

/* ----------------------------------------------------
   GOOGLE LOGIN
---------------------------------------------------- */
export const googleAuth = (req, res) => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?${qs.stringify({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
  })}`;

  res.redirect(url);
};

export const googleCallback = async (req, res) => {
  try {
    const code = req.query.code;

    // Exchange auth code for token
    const tokenRes = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }
    );

    const id_token = tokenRes.data.id_token;
    const payload = JSON.parse(Buffer.from(id_token.split(".")[1], "base64"));

    const email = payload.email;
    const name = payload.name;

    // find or create user
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        password: "oauth-user-no-password",
      });
    }

    const token = generateToken(user._id);

    return res.redirect(`${FRONTEND_URL}/oauth?token=${token}`);
  } catch (err) {
    console.error("Google OAuth Error:", err.message);
    return res.redirect(`${FRONTEND_URL}/login`);
  }
};

/* ----------------------------------------------------
   LINKEDIN LOGIN
---------------------------------------------------- */
export const linkedinAuth = (req, res) => {
  const url = `https://www.linkedin.com/oauth/v2/authorization?${qs.stringify({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID,
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
    scope: "openid profile email",
  })}`;

  res.redirect(url);
};

export const linkedinCallback = async (req, res) => {
  try {
    const code = req.query.code;

    const tokenRes = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      qs.stringify({
        grant_type: "authorization_code",
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const accessToken = tokenRes.data.access_token;

    // fetch LinkedIn user info
    const profileRes = await axios.get(
      "https://api.linkedin.com/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const { email, name } = profileRes.data;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        password: "oauth-user-no-password",
      });
    }

    const token = generateToken(user._id);

    return res.redirect(`${FRONTEND_URL}/oauth?token=${token}`);
  } catch (err) {
    console.error("LinkedIn OAuth Error:", err.message);
    return res.redirect(`${FRONTEND_URL}/login`);
  }
};
