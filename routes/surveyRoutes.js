const mongoose = require('mongoose')
const requireLogin = require('../middlewares/requireLogin')
const requireCredits = require('../middlewares/requireCredits')
const Mailer = require('../services/Mailer')
const Survey = mongoose.model('surveys')
const surveyTemplate = require('../services/emailTemplates/surveyTemplate')

module.exports = app => {
  app.get('/api/surveys/thanks', (req, res) => {
    res.send('thanks for voting')
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