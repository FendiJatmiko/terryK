require('dotenv').config();
const mongo_url = 'mongodb://localhost:27017/profiles';
const express = require('express');
const app = express();
const puppeteer   = require('puppeteer');
const mongoose = require('mongoose')
// end of import
const Profiles = require('./model/profile.js')
const dom = require("./dom.json");

mongoose.connect('mongodb://localhost:27017/profiles', function (err){
    if (err) throw err;
  console.log('connected database succesfully')
})
// main apps logic start here....
app.get('/v1/:profile', function(req, res) {
  var profile = req.params.profile
  var urlProfile = "https://instagram.com/"+profile

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({width: 1366, height: 768});
  await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebkit/537.36 (KMHTML, like Gecko) Chrome/78.0.3904.108 Safaari/537.36');
  
  // go to Instagram web profile
  await page.goto('https://instagram.com/'+profile, {
      waitUntil: "networkidle0"
  });
  //check if username exists or not
  let isUsernameNotFound = await page.evaluate(() => {
    if(document.getElementsByTagName('h2')[0]) {
        //cehck selector text content
        if(document.getElementsByTagName('h2')[0].textContent == "Sorry , this page isn't available") {
          return true;
      }
    }
  });

  if(isUsernameNotFound) {
      console.log('Account not Exists!');
    //close browser
    await browser.close();
    return ;
  }
  let sharedData = await  page.evaluate(() => {
    return window._sharedData.entry_data.ProfilePage[0].graphql.user;
  });
  //get username
  let username = await page.evaluate(() => {
    return document.querySelectorAll('header > section h1')[0].textContent;
  });

  // get number of total posts
  let postCount = await page.evaluate(() => {
    return document.querySelectorAll('header > section > ul > li span')[0].textContent.replace(/\,/g, '');
  });

  // get number of total followers
  let followersCount = await page.evaluate(() => {
    return document.querySelectorAll('header > section > ul > li span')[1].getAttribute('title').replace(/\,/g, '');
  });
  // get number of total following  
  let followingCount = await page.evaluate(() => {
    return document.querySelectorAll('header > section > ul > li span')[2].textContent.replace(/\,/g, '');
  })
  //get bio name
  let name = await page.evaluate(() => {
      // check selector exists
    if(document.querySelectorAll('header > section h1')[1]) {
      return document.querySelectorAll('header > section h1')[1].textContent
    }else {
      return '';
    }
  });

  //get bio description
  let bio = await page.evaluate(() => {
    if (document.querySelectorAll('header h1')[1].parentNode.querySelectorAll('span')[0]) {
      return document.querySelectorAll('header h1')[1].parentNode.querySelectorAll('span')[0].textContent;
    } else {
        return '' ;
    }
  });
  //get bio URL
  let bioUrl = await page.evaluate(() => {
    //check selector exists
    if(document.querySelectorAll('header > section div > a')[1]) {
      return document.querySelectorAll('header > section div > a')[1].getAttribute('href');
    } else {
      return '';
    }
  });

  //check if account is private or not
  let isPrivateAccount = await page.evaluate(() => {
    if (document.getElementsByTagName('h2')[0]) {
      if (document.getElementsByTagName('h2')[0].textContent == 'This account is Private') {
        return true;
      }else {
        return false;
      }
    } else {
      return false
    }
  });
    const data = await page.evaluate(dom => {
        return {
          urlImage: document.querySelector(dom.urlImage)
            ? document.querySelector(dom.urlImage).getAttribute("src")
            : null,

          video: document.querySelector(dom.video)
            ? document.querySelector(dom.video).getAttribute("src")
            : null,

          description: document.querySelector(dom.description)
            ? document.querySelector(dom.description).textContent
            : null,

          likeNumber: document.querySelector(dom.likeNumber)
            ? document.querySelector(dom.likeNumber).textContent
            : null,

          videoViewsNumber: document.querySelector(dom.viewNumber)
            ? document.querySelector(dom.viewNumber).textContent
            : null
        };
      }, dom);
  console.log(data)
  // Get info in profil

  console.log(sharedData)
  //get recent posts ( array of url and photo )  
  let recentPosts = await page.evaluate(() => {
  let results = [];
  // loop on recent posts selector
  document.querySelectorAll('div[style*="flex-direction"] div > a').forEach((el) => {
    let post = {};
    //fill the post object with URL and photo data
    post.url = 'https://www.instagram.com' + el.getAttribute('href');
    post.photo = el.querySelector('img').getAttribute('src');
    //add the object to results array ( by push opperation
      results.push(post);
    });
  // recentPosts will contains data from results
   return results;
  });

  var post_url;
  var post_photo;

  recentPosts.forEach((el, i) => {
    post_url = el.url,
    post_photo = el.photo
  });

  //close the browser

  var profiles = new Profiles({
    _id: new mongoose.Types.ObjectId(),
    url_profile: urlProfile,
    number_of_post: postCount,
    number_of_follower: followersCount,
    profile_description: bio,
    post: [{
      user_id: urlProfile,
      url: post_url,
      url_image: post_photo,
      isVideo: Boolean,
      multiple_image: Boolean,
      tags: Array,
      mention: Array,
      description: String,
      localization: String,
        date: {
          type: Date,
          default: Date.now
        }
    }]
  });

  profiles.save(function(err) {
    if(err) throw err;
    console.log('data profile saved succesfully');
  })

    await browser.close();
  })();
});

app.listen(3000, () => console.log(`insta scrapper is running on port 3000`));
