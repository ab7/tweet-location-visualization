import os
import json

import webapp2
import jinja2

import tweepy

template_dir = os.path.join(os.path.dirname(__file__), 'templates')
jinja_env = jinja2.Environment(loader = jinja2.FileSystemLoader(template_dir),
                               autoescape = True)


class Handler(webapp2.RequestHandler):
    def write(self, *a, **kw):
        self.response.out.write(*a, **kw)
        
    def render_str(self, template, **params):
        t = jinja_env.get_template(template)
        return t.render(params)
        
    def render(self, template, **kw):
        self.write(self.render_str(template, **kw))

    def render_json(self, d):
        json_txt = json.dumps(d)
        self.response.headers['Content-Type'] = 'application/json; charset=UTF-8'
        self.write(json_txt)

    def make_cookie(self, name, val):
        cookie_val = tools.make_secure_val(str(val))
        return self.response.headers.add_header(
                        'Set-Cookie', 
                        '%s=%s; Path=/' % (name, cookie_val)
                        )


class Front(Handler):
    def get(self):
        if self.request.get('fmt') == 'json':
            # hacked tweepy to return raw json instead of tweepy objects
            consumer_key = '***'
            consumer_secret = '***'
            access_token = '***'
            access_token_secret = '***'
            auth = tweepy.OAuthHandler(consumer_key, consumer_secret)
            auth.set_access_token(access_token, access_token_secret)
            twitter = tweepy.API(auth)
            hashtag = self.request.get('hashtag')
            self.response.out.headers['Content-Type'] = 'text/json'
            tweets = twitter.search(q=hashtag, count=100)
            write_tweets = self.response.out.write(tweets)
            return
        self.render('index.html')


        
app = webapp2.WSGIApplication([('/', Front)], debug=True)