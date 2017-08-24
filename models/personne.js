const mongoose = require('mongoose');

module.exports = mongoose.model('personnes', new mongoose.Schema({
    nom: { type: String, required: true },
    prenom: { type: String },
    twitter: { type: String },
    photoprofil: [{ type: mongoose.Schema.Types.ObjectId, ref:'PhotoProfil' }]
}));