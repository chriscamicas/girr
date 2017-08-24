const express = require('express');
const path = require('path');
const router = express.Router();
const Personne = require('../models/personne');
const PhotoProfil = require('../models/photoprofil');
const photoprofilRoute = require('./photoprofil');

router.get('/', (req, res, next) => {
	Personne.find().exec((err, perso) => {

        if(perso)
            perso.forEach(p => {
                if(p.photoprofil.length > 0)
                    {
                        p.photoprofil[0] = '/api/photoprofil/' + p.photoprofil[0];
                    }
                
        });
        if (err) return next(err);
        res.send(perso);
    });
});


router.get('/:personnes', (req, res) => {
    var p =  Personne.findOne({
          _id: req.params.personnes}, (err, p) => {
              if(err) return next(err);
              if (p === null) {
                  return res.sendStatus(404);
              }
              p.photoprofil = p.photoprofil.map(photoprofil => path.join(req.originalUrl, 'photoprofil', photoprofil.toString()));
              
              return res.send(p);
             
          });
       
  })


router.post('/:personnes', (req, res, next) => {
    let personne = new Personne({
        nom: req.params.personnes,
        prenom: req.params.personnes,
        twitter: ''
    });
    personne.save(err => {
        if (err) return next(err);
        res.setHeader('location', req.path);
        return res.sendStatus(201);
    });
});

router.use('/:personnes', (req, res, next) => {
   Personne.findOne({
        _id: req.params.personnes
    }, (err, personne) => {
        if(err) return next(err);
        if (personne === null) {
            return res.sendStatus(404);
        }
        req.personne = personne;
        next();
    });
})



router.put('/:personnes', (req, res, next) => {	Personne.findOneAndUpdate({		
            _id: req.params.personnes
        }, req.body, { new: false }, (err, p) => {
        if (err) return next('###Erreur' . err);
        if (p === null) {return next('###Erreur' . err);}
        return res.send(p);
        }
    );}	);


router.delete('/:personnes', (req, res, next) => {
    Personne.findOneAndRemove({
        nom: req.params.personne
    }, err => {
        if(err) return next(err);
        return res.sendStatus(204);
    });
});




router.use('/:personnes/photoprofil', photoprofilRoute);

module.exports = router;