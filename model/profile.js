const mongoose = require('mongoose');

const profileSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    url_profile: {
      type: String,
      default: true,
    },
    number_of_post:{
      type: Number,
      default: true,
    },
    number_of_follower: {
      type: Number,
      default: true,
    },
    profile_description: {
      type: String,
      default: true,
    },
    posts: [
      {
        user_id: String,
        url:    String,
        url_image: String,
        isVideo: Boolean,
        multiple_image: Boolean,
        tags: Array,
        mention: Array,
        description: String,
        localization: String,
          date: {
            type: Date,
            default: Date.now
          },
        number_of_likes: Number,
        number_of_comments: Number
      }
    ],


});

var profileSchems = mongoose.model('ProfileSceme', profileSchema)

module.exports = profileSchems
