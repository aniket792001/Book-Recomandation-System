from flask import Flask, render_template, request, session, redirect, url_for, flash
import pickle
import numpy as np
import flask_mysqldb as MYSQL  # Uncomment if you need MySQL integration and have flask_mysqldb installed
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.fields import EmailField
from wtforms.validators import DataRequired, Email, ValidationError
import bcrypt
import pandas as pd
from flask import request, session




class Register_Form(FlaskForm):
    name = StringField("Name", validators=[DataRequired()])
    email = StringField("Email", validators=[DataRequired(), Email()])
    password = StringField("Password", validators=[DataRequired()])
    submit = SubmitField("Register")

class LoginForm(FlaskForm):
        email = EmailField("Email", validators=[DataRequired(), Email()])
        password = PasswordField("Password", validators=[DataRequired()])
        submit = SubmitField("Login")
# Import necessary libraries
    



popular_df = pickle.load(open('popular.pkl','rb'))
pt = pickle.load(open('pt.pkl','rb'))
books = pickle.load(open('books.pkl','rb'))
similarity_scores = pickle.load(open('similarity_scores.pkl','rb'))

app = Flask(__name__)


# Route for the home page
@app.route('/')
def index():
    return render_template('index.html',
                           book_name = list(popular_df['Book-Title'].values),
                           author=list(popular_df['Book-Author'].values),
                           image=list(popular_df['Image-URL-M'].values),
                           votes=list(popular_df['num_ratings'].values),
                           rating=list(popular_df['avg_rating'].values)
                           )



# Recomandation Page
@app.route('/recommend', methods=['GET', 'POST'])
def recommend():
    # Your GET logic here
    return render_template('recommend.html')


#Contact Us Page
@app.route('/contact')
def contact():
    return render_template('contact.html')


#REcomendation Books
@app.route('/recommend_books',methods=['post'])
def recommend_books():
    user_input = request.form.get('user_input')
    matches = np.where(pt.index == user_input)[0]
    if len(matches) == 0:
        # Book not found, handle gracefully
        return render_template('recommend.html', data=[], message="Book not found. Please enter a valid book title.")
    index = matches[0]
    similar_items = sorted(list(enumerate(similarity_scores[index])), key=lambda x: x[1], reverse=True)[1:5]

    data = []
    for i in similar_items:
        item = []
        temp_df = books[books['Book-Title'] == pt.index[i[0]]]
        item.extend(list(temp_df.drop_duplicates('Book-Title')['Book-Title'].values))
        item.extend(list(temp_df.drop_duplicates('Book-Title')['Book-Author'].values))
        item.extend(list(temp_df.drop_duplicates('Book-Title')['Image-URL-M'].values))

        data.append(item)

    print(data)

    # Increment search count in session
    if 'search_count' in session:
        session['search_count'] += 1
    else:
        session['search_count'] = 1

    # Define message variable before passing to template
    message = ""
    # Pass search_count to the template if you want to display it
    return render_template('recommend.html', data=data, message=message, search_count=session['search_count'])


#Dashboard code
@app.route('/dashboard')
def dashboard():
    if 'name' in session:
        return render_template(
            'dashboard.html',
            name=session.get('name'),
            email=session.get('email'),
            password=session.get('password'),
            search_count=session.get('search_count', 0)
        )
    else:
        return redirect(url_for('login'))


#Login Page 
@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    message = None

    if form.validate_on_submit():
        email = form.email.data
        password = form.password.data

        cursor = mysql.connection.cursor()
        cursor.execute("SELECT password, name FROM user WHERE email = %s", (email,))
        user = cursor.fetchone()
        cursor.close()

        if user and bcrypt.checkpw(password.encode('utf-8'), user[0].encode('utf-8')):
            # Login successful
            session['name'] = user[1]
            session['email'] = email
            session['password'] = password  # Not recommended for production!
            session['search_count'] = 0
            return redirect(url_for('dashboard'))
        else:
            message = "Invalid email or password."

    return render_template('login.html', form=form, message=message)
  

  #Register Page
@app.route('/register', methods=['GET', 'POST'])
def register():
    form = Register_Form()  # Create the form object
    if request.method == 'POST' and form.validate_on_submit():
        name = form.name.data
        email = form.email.data
        password = form.password.data

        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Here you would typically save the user data to a database
        # For demonstration, we will just print it
        print(f"Name: {name}, Email: {email}, Password: {password}")
        cursor = mysql.connection.cursor()
        cursor.execute("INSERT INTO user (name, email, password) VALUES (%s, %s, %s)", (name, email, hashed_password))
        mysql.connection.commit()
        cursor.close()
        print("User registered successfully!")
        flash('Registration successful! Please log in.', 'success')
        return redirect(url_for('login'))  # Redirect to login after successful registration
    return render_template('register.html', form=form)

############################################################################### 
###############################################################################

# MySQL configuration
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'Aniket@123'
app.config['MYSQL_DB'] = 'book_recomendation_system'
app.secret_key = 'secret_key_here'  # Set a secret key for session management
mysql = MYSQL.MySQL(app)


# Logout route to clear the session
@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/book_library')
def book_library():
    books = [
        {'id': 1, 'title': 'Book 1', 'author': 'Author 1', 'description': 'A great book.', 'cover_url': '/static/cover1.jpg'},
        {'id': 2, 'title': 'Book 2', 'author': 'Author 2', 'description': 'Another book.', 'cover_url': '/static/cover2.jpg'}
    ]
    recommended_books = [
        {'title': 'Recommended Book', 'author': 'Author 3', 'cover_url': '/static/cover3.jpg'}
    ]
    return render_template('book_library.html', books=books, recommended_books=recommended_books)

@app.route('/book/<int:book_id>')
def book_detail(book_id):
    # Replace this with your real database lookup
    books = [
        {'id': 1, 'title': 'Book 1', 'author': 'Author 1', 'description': 'A great book.', 'cover_url': '/static/cover1.jpg'},
        {'id': 2, 'title': 'Book 2', 'author': 'Author 2', 'description': 'Another book.', 'cover_url': '/static/cover2.jpg'}
    ]
    # Find the book by id
    book = next((b for b in books if b['id'] == book_id), None)
    if not book:
        return "Book not found", 404
    return render_template('book_detail.html', book=book)



if __name__ == '__main__':
    app.run(debug=True, port=5000)