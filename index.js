import { ChatGPTAPI } from 'chatgpt'
import axios from 'axios';

const postData = async ({ data }) => {
  try {
    const response = await axios.post('https://api.medium.com/v1/users/1749387ecb5aeac599d17b98e5df1c0f67407baab23e6f8e79d9be7b1728ce46c/posts', data, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer 21b33e7589c22e5d9e8d9844bdd14e2d1653ce7b025e499f28ccd52463aec6dc5`
      }
    });
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
};

// No esta guardando contexto y necesito que guarde contexto
async function example() {
  try {

    const postQuestion = `Give me an article for a blog that is only about one of these topics of your random choice: Cats, Technology, Photography, Food, Personal Help, Politics, Social Networking, Gaming, Sports, Style, Fashion. It must be in English, be at least 1700 characters long, give me 5 keywords that describe the article and have the following format: 
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

    const mediumPost = await postData({
      data: {
        "title": title,
        "contentFormat": "html",
        "content": `<h1>${title}</h1><p><img src="https://source.unsplash.com/random/700×500/?${randomKeyword}" alt="${randomKeyword} photo"/></p><p>${history}</p>`,
        "canonicalUrl": "https://medium.com/@keepgoodhabits",
        "tags": keywords,
        "publishStatus": "public",
        license: "all-rights-reserved",
        notifyFollowers: true
      }
    })

    console.log(mediumPost)
  } catch (e) {
    console.error(e)
  }
}

example()