import axios from 'axios';
import { ChatGPTAPI } from 'chatgpt';
import express from 'express';
import FormData from 'form-data';
import fs from 'fs';
import { google } from 'googleapis';
import open from 'open';
import cron from 'node-cron'
const app = express();

const fileName = 'tokens.txt';

// Crear cliente
// const client = google.blogger({ version: 'v3', auth });

// // Obtener información sobre los blogs del usuario
// async function getBlogs() {
//   try {
//     const res = await client.blogs.listByUser({ userId: 'self' });
//     const blogs = res.data.items;
//     console.log(blogs);
//   } catch (err) {
//     console.error('Error:', err);
//   }
// }

// const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const CLIENT_ID = '335451512916-958ks4j4hmot2744s9r2ha4vipenu11k.apps.googleusercontent.com';
const CLIENT_SECRET = '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';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  "http://localhost:3000/googleauthcallback"
);

const blogger = google.blogger({ version: 'v3', auth: oauth2Client });

// Generate the url that will be used for the consent dialog.
const authorizeUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/blogger'],
});

const FBPageToken = "EAADKiS8kKN0BAE1RlQg6nuFd4bnlrg6260ZBdSQY3iiY2xoOIEM6IT9EthczKWy6YjwGmi3W6xnsPguv9MkQNX0zvnd0NYEZBIyG2HBS91KZAoi4ALVpyhphc2MGZA0q5A6pAwrQDP1w1dKESgTRZAYZBGU8brdBad3ypZAFDooeIxb2YOhbPsVH8aSw0cr6Vi2rPRiZA91SYwZDZD"

const fbConfig = {
  url: "https://graph.facebook.com/161164451184628/photos",
  token: FBPageToken
}

const mediumConfig = {
  url: 'https://api.medium.com/v1/users/1749387ecb5aeac599d17b98e5df1c0f67407baab23e6f8e79d9be7b1728ce46c/posts',
  token: '21b33e7589c22e5d9e8d9844bdd14e2d1653ce7b025e499f28ccd52463aec6dc5'
}

const postData = async ({ data, config = mediumConfig, contentType = 'application/json' }) => {
  try {
    const headers = {
      'Content-Type': contentType, // 'application/json' - 'multipart/form-data'
      Authorization: `Bearer ${config.token}`
    };

    const response = await axios.post(config.url, data, { headers });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

const getRandomEmoji = () => {
  const emojis = ['😀', '😆', '😍', '🤣', '😎', '😜', '😘', '🥰', '😇', '🤪', '🤩'];
  const randomIndex = Math.floor(Math.random() * emojis.length);
  return emojis[randomIndex];
}

async function urlToFile(url) {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer'
    });

    const contentType = response.headers['content-type'];
    const extension = contentType.split('/')[1];
    const buffer = Buffer.from(response.data, 'binary');
    const fileName = `image.${extension}`;

    const stats = fs.statSync(fileName);
    const fileSizeInBytes = stats.size;

    const file = {
      name: fileName,
      type: contentType,
      size: fileSizeInBytes,
      data: buffer
    };

    return file;
  } catch (error) {
    console.error(error);
  }
}

const getChatGPTBlog = async () => {

  const topicOptions = [
    'Cats',
    'Technology',
    'Photography',
    'Food',
    'Personal Help',
    'Politics',
    'Social Networking',
    'Gaming',
    'Sports',
    'Style',
    'Fashion',
    "Tips"
  ];

  // Order the topics in a random way and join them with a comma and with a space after the comma
  let randomTopics = topicOptions.sort(() => Math.random() - 0.5)

  // Create a new array from randomTopics variable, delete random elements and always returning at least 1 element
  // const randomTopicsFiltered = randomTopics.splice(0, Math.floor(Math.random() * randomTopics.length) + 1)
  const randomTopicsStr = randomTopics.join(', ');

  const languages = ["Spanish", "English"]
  // Select a random language
  const randomLanguage = languages[Math.floor(Math.random() * languages.length)]

  const postQuestion = `Give me an article for a blog that is only about one of these topics of your choice: ${randomTopicsStr}. It must be in ${randomLanguage}, be at least 2000 characters long, give me 5 keywords that describe the article and have the following format:
  Title: [Title]

  Story: [Story]

  Keywords: [keywords]`;

  const api = new ChatGPTAPI({
    apiKey: "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"
  })

  const res = await api.sendMessage(postQuestion,
    {
      timeoutMs: 5 * 60 * 1000
    }
  )

  console.log(res.text)
  let textChatGPT = res.text

  const separate = textChatGPT.split("\n\n")
  const separateLength = separate.length
  let titleUnFormatted = separate[0].split(": ")
  titleUnFormatted.splice(0, 1)
  const title = titleUnFormatted.join(": ").trim()
  const keywordsSpaces = separate[separateLength - 1].split(": ")[1].split(",")
  const keywords = keywordsSpaces.map(key => key.trim().toLowerCase())
  separate.splice(0, 1)
  separate.splice(separateLength - 2, 1)
  separate[0] = separate[0].split(": ")[1]
  const history = separate.join("<br/></br>")

  // Choose a random element from the keywords array, take the first word without trim spaces and save into a variable
  const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)].split(" ")[0]
  console.log("🙂", randomKeyword)

  return {
    title,
    history,
    keywords,
    randomKeyword
  }
}

const publishPostOnFacebook = async ({
  imageURL,
  postURL,
  textContent,
  platform = `Medium ${getRandomEmoji()}`
}) => {
  try {
    const image = await urlToFile(imageURL)
    const form = new FormData();
    const withTitle = platform && postURL ? `Léenos y síguenos en ${platform} ${postURL}\n\n` : ""

    // Agregar un campo de texto
    form.append('source', image.data, { filename: image.name });
    form.append('message', `${withTitle}${textContent.replaceAll("<br/></br>", "\n\n")}`);

    // Publicar en Facebook
    await postData({
      data: form,
      config: fbConfig,
      contentType: "multipart/form-data"
    })

  } catch (error) {
    console.error(error)
    console.log(`Error intentando publicar en api de Facebook 🤨`)
  }
}

const publishOnFacebook = async () => {
  for (let i = 0; i < 20; i++) {
    try {
      const {
        title,
        history,
        randomKeyword
      } = await getChatGPTBlog()

      const imageURL = `https://source.unsplash.com/random/500×500/?${randomKeyword}`

      await publishPostOnFacebook({
        imageURL,
        textContent: `${title}\n\n${history}`,
      })

      console.log(`Publicación ${i + 1} en página de Facebook 😎 completada.`);

    } catch (error) {
      console.log("Error al intentar publicar en Facebook 💻💻")
      console.error(error)
    }
  }
}

// No esta guardando contexto y necesito que guarde contexto
async function publishOnMedium() {
  for (let i = 0; i < 15; i++) {
    try {
      const {
        title,
        history,
        keywords,
        randomKeyword
      } = await getChatGPTBlog()

      const imageURL = `https://source.unsplash.com/random/500×500/?${randomKeyword}`

      const { data } = await postData({
        data: {
          "title": title,
          "contentFormat": "html",
          "content": `<h1>${title}</h1><p><img src="${imageURL}" alt="${randomKeyword} photo"/></p><p>${history}</p>`,
          "canonicalUrl": "https://medium.com/@keepgoodhabits",
          "tags": keywords,
          "publishStatus": "public",
          license: "all-rights-reserved",
          notifyFollowers: true
        }
      })

      console.log(`Medium response: ${JSON.stringify(data)}`)

      await publishPostOnFacebook({
        imageURL,
        postURL: data.url,
        textContent: history,
      })

      console.log(`Publicación ${i + 1} Medium 💪 completada.`);
    } catch (e) {
      console.log("Error 😅")
      console.error(e)
    }
  }
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function createPostBlogger({
  title,
  content,
}) {
  try {
    const response = await blogger.posts.insert({
      blogId: '3813711803494966288',
      resource: {
        title,
        content,
      },
    });

    console.log(`Post created: ${response.data.url} 🍳`);
    return response.data.url
  } catch (error) {
    console.error(`Error creating post: ${error}`);
  }
}

async function publishOnBlogger() {
  let count = 0;
  while (count < 50) {
    try {
      const { title, history, randomKeyword } = await getChatGPTBlog();

      const imageURL = `https://source.unsplash.com/random/500×500/?${randomKeyword}`

      const content = `<p>${history}</p> <img src='${imageURL}' alt='${randomKeyword} photo' max-width='500' max-height='500'/>`;

      const createdPostUrl = await createPostBlogger({ title, content });
      console.log(`Publicación ${count + 1} Blogger 🍕 completada.`);

      await publishPostOnFacebook({
        imageURL,
        postURL: createdPostUrl,
        textContent: history,
        platform: `Blogger ${getRandomEmoji()}`
      })

      count++;

      await delay(10000);
    } catch (error) {
      console.error(`Error in iteration ${count + 1}: ${error}`);
      await delay(10000);
    }
  }
}

async function init() {
  try {
    if (fs.existsSync(fileName)) {
      const tokens = fs.readFileSync(fileName, 'utf8');
      // console.log("💪", tokens);
      oauth2Client.setCredentials(JSON.parse(tokens));
    } else {
      // Solo se llama si el intento de post a blogger no funciona y necesita un nuevo token
      await open(authorizeUrl);
    }

    await publishOnMedium();
    await publishOnBlogger();
    await publishOnFacebook();

    process.exit();
  } catch (e) {
    console.error(e)
  }
}

// Exchange the authorization code for an access token.
app.get('/googleauthcallback', async (req, res) => {
  const { tokens } = await oauth2Client.getToken(req.query.code);
  console.log("🤨")
  console.log(tokens)
  const newContent = JSON.stringify(tokens);

  fs.writeFileSync(fileName, newContent, { flag: 'w' });

  oauth2Client.setCredentials(tokens);
  res.redirect('/blogger');
});

// Inicia el servidor
app.listen(3124, () => {
  console.log('La aplicación está corriendo en http://localhost:3124');
  console.log("CRON INICIALIZADO")
  let counter = 1
  cron.schedule("0 0 13 * * *", () => {
    console.log("Ejecutando Cron de posts #" + counter)
    init().then(() => console.log("Ejecusion cron Finalizada #" + counter)).catch(err => console.log("ERROR: #" + counter, err))
    counter++;
  })
  init();
});