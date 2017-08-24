const mongoose = require('mongoose');

module.exports = mongoose.model('PhotoProfil', new mongoose.Schema({
    personne: { type: mongoose.Schema.Types.ObjectId, ref:'Personne' },
    data: Buffer,
    contentType: String
}));