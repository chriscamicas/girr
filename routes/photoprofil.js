const express = require('express');
const path = require('path');
const router = express.Router();
const PhotoProfil = require('../models/photoprofil');
const Personne = require('../models/personne');
const fileUpload = require('express-fileupload');
const request = require('request');

router.get('/', (req, res) => {
    return res.send(req.personne.photoprofil);
});

router.get('/:photoprofil', (req, res, next) => {
    PhotoProfil.findOne({ _id: req.params.photoprofil }, (err, photoprofil) => {
        if (err) return next(err);
        if (photoprofil) {
            res.contentType = photoprofil.contentType;
            res.setHeader('content-type', photoprofil.contentType);
            return res.send(photoprofil.data);
        }
        return res.sendStatus(404);
    });

});

router.use(fileUpload());

router.post('/', (req, res, next) => {
    // soit on envoie des fichiers directements, soit des urls en texte
    if (!req.files) {
        // on recoit directement des url
        let uri = req.body.uri;
        console.log(uri);


        request({ url: uri, encoding: null }, (error, response, body) => {
            let photoprofil = new PhotoProfil({
                personne: req.personne._id,
                data: body,
                contentType: response.headers['content-type']
            });
			console.log('Request crée');
            photoprofil.save(err => {
                if (err) return next(err);
                req.personne.photoprofil.push(photoprofil);
				console.log('push ok');
                req.personne.save(err => {
                    if (err) return next(err);
					console.log('personne.save ');
                    res.setHeader('location', path.join(req.originalUrl, photoprofil._id.toString()));
					console.log('personne.save fin ');
                    return res.sendStatus(201);
                });
            });
        });
    } else {
        // .incrust est le nom du form
        // let incrustFile = req.files.incrust;
        // incrustFile.mv(path.join(req.localPathToIncrusts, req.files.incrust.name), err => {
        //     if (err)
        //         return res.status(500).send(err);
        //     res.send('File uploaded!');
        // });
        return res.send(req.personne.photoprofil);
    }
});

router.delete('/:photoprofil', (req, res, next) => {
    PhotoProfil.findOneAndRemove({
        _id_: req.params.photoprofil
    }, (err, photoprofil) => {
        if (err) return next(err);

        News.findOne({ _id_: photoprofil.personne }, (err, news) => {
            if (err) return next(err);
            if (personne) {
                let indexPhotoProfilToRemove = personne.photoprofil.indexOf(photoprofil._id_);
                if (indexPhotoProfilToRemove !== -1) {
                    personne.photoprofil.splice(indexPhotoProfilToRemove, 1);
                    personne.save(err => {
                        if (err) return next(err);
                        return res.sendStatus(204);
                    });
                } else {
                    return res.sendStatus(204);
                }
            } else {
                return res.sendStatus(204);
            }
        });
    });
});

module.exports = router;