
// Use the access token to make requests to the Blogger API.
app.get('/blogger', async (req, res) => {
  await init()
  // const blogger = google.blogger({version: 'v3', auth: oauth2Client});
  // const blog = await blogger.blogs.get({blogId: '3813711803494966288'});
  // console.log(blog)
  res.send("Hello from");
});

const getPost = async () => {
  try {
    const blogger = google.blogger({ version: 'v3', auth: oauth2Client });
    const blog = await blogger.blogs.get({ blogId: '3813711803494966288' });
    console.log(blog)
  } catch (error) {
    await open(authorizeUrl);
    console.log(error)
    console.log("Error con tokens blogger, vuelva a autenticarse, se abrio la url de autenticación ✨")
  }
}

// Autenticación
const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/blogger'],
});
