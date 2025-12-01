import axios from "axios";
import qs from "querystring";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/user.model.js";

const FRONTEND_URL = process.env.FRONTEND_URL;

// Create JWT
const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });


// ----------------------------------------------------
// Helper: Ensure OAuth user is created properly
// ----------------------------------------------------
const findOrCreateOAuthUser = async ({ name, email, provider, providerId }) => {
  if (!email) {
    console.error("❌ OAuth Error: No email returned from provider");
    return null;
  }

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name: name || "Unknown User",
      email,
      role: "viewer",
      provider,
      providerId,
      password: crypto.randomBytes(20).toString("hex"), // Random hashed placeholder
    });
  }

  return user;
};


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
    const providerId = payload.sub;

    const user = await findOrCreateOAuthUser({
      name,
      email,
      provider: "google",
      providerId,
    });

    if (!user) return res.redirect(`${FRONTEND_URL}/login?error=no-email`);

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

    const { email, name, sub: providerId } = profileRes.data;

    const user = await findOrCreateOAuthUser({
      name,
      email,
      provider: "linkedin",
      providerId,
    });

    if (!user) return res.redirect(`${FRONTEND_URL}/login?error=no-email`);

    const token = generateToken(user._id);

    return res.redirect(`${FRONTEND_URL}/oauth?token=${token}`);
  } catch (err) {
    console.error("LinkedIn OAuth Error:", err.message);
    return res.redirect(`${FRONTEND_URL}/login`);
  }
};



// ----------------------------------------------------
// FACEBOOK LOGIN
// ----------------------------------------------------
export const facebookAuth = (req, res) => {
  const params = {
    client_id: process.env.FACEBOOK_APP_ID,
    redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
    response_type: "code",
    scope: "email,public_profile",
  };

  const url =
    "https://www.facebook.com/v20.0/dialog/oauth?" + qs.stringify(params);

  return res.redirect(url);
};

export const facebookCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) return res.redirect(`${FRONTEND_URL}/auth-failed`);

    // Exchange code for token
    const tokenURL = "https://graph.facebook.com/v20.0/oauth/access_token";

    const tokenRes = await axios.get(tokenURL, {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
        code,
      },
    });

    const accessToken = tokenRes.data.access_token;

    // Fetch profile
    const userRes = await axios.get(
      "https://graph.facebook.com/me?fields=id,name,email",
      {
        params: { access_token: accessToken },
      }
    );

    const { id: providerId, name, email } = userRes.data;

    const user = await findOrCreateOAuthUser({
      name,
      email,
      provider: "facebook",
      providerId,
    });

    if (!user) return res.redirect(`${FRONTEND_URL}/login?error=no-email`);

    const token = generateToken(user._id);

    return res.redirect(`${FRONTEND_URL}/oauth?token=${token}`);
  } catch (err) {
    console.error("FACEBOOK OAuth Error:", err.response?.data || err.message);
    return res.redirect(`${FRONTEND_URL}/auth-failed`);
  }
};
