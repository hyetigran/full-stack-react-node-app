const _ = require('lodash')
const Path = require('path-parser')
const { URL } = require('url')
const mongoose = require('mongoose')
const requireLogin = require('../middlewares/requireLogin')
const requireCredits = require('../middlewares/requireCredits')
const Mailer = require('../services/Mailer')
const Survey = mongoose.model('surveys')
const surveyTemplate = require('../services/emailTemplates/surveyTemplate')

module.exports = app => {
  app.get('/api/surveys', requireLogin, async (req, res) => {
    const surveys = await Survey.find({ _user: req.user.id})
      .select({ recipients: false});

    res.send(surveys)
  })
  
  app.get('/api/surveys/:surveyId/:choice', (req, res) => {
    res.send('thanks for voting')
  })

  app.post('/api/surveys/webhooks', (req, res) => {
  const p = new Path('/api/surveys/:surveyId/:choice')
    _.chain(req.body)
    .map(req.body, ({email, url}) => {
      const match = p.test(new URL(url).pathname)
      if (match) {
        return {email, surveyId: match.surveyId, choice: match.choice};
      }
    })
    .compact()
    .uniqBy( 'email', 'surveyId')
    .each(({surveyId, email, choice}) => {
      Survey.updateOne({
        _id: surveyId,
        recipients: {
          $elemMatch: { email: email, responded: false}
        }
      }, {
        $inc: {[choice]: 1},
        $set: {'recipients.$.responded': true },
        lastResponded: new Date()
      }).exec()
    })
    .value();

  })

  app.post('/api/surveys', requireLogin, requireCredits, async (req, res) => {
    const { title, subject, body, recipients } = req.body;

    const survey = new Survey({
      title: title,
      subject: subject,
      body: body,
      recipients: recipients.split(',').map(email =>  ({email: email.trim()})),
      _user: req.user.id,
      dateSent: Date.now()
    })

    const mailer = new Mailer(survey, surveyTemplate(survey))
    try {
      await mailer.send();
      await survey.save();
      req.user.credits -= 1;
      await req.user.save();
  
      res.send(user);

    } catch (error) {
      res.status(422).send(error)
    }
  })

  
}