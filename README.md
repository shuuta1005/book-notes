# Book Tracker App  

A full-stack web application that allows users to keep track of books they’ve read. This app provides secure authentication, responsive design, and CRUD functionality for managing books.  

## Features  

- **User Authentication**:  
  - Supports both Google OAuth and local authentication for secure login and registration.  

- **CRUD Functionality**:  
  - Add, edit, view, and delete books.  
  - Includes fields for book title, author, ISBN, rating, date read, and personal notes.  

- **Book Cover Integration**:  
  - Displays book covers using the Open Library API, with a fallback to a default cover.  

- **Responsive Design**:  
  - Built using Bootstrap to ensure compatibility across devices of all sizes.  

- **PostgreSQL Database**:  
  - Efficiently stores user and book data with relational database management.  

## Technologies Used  

### Backend:  
- Node.js  
- Express.js  

### Frontend:  
- EJS templates for server-side rendering.  
- Bootstrap 5 for styling and responsive design.  

### Database:  
- PostgreSQL for storing user data and book records.  

### Authentication:  
- Google OAuth for quick and secure login.  
- Local authentication with encrypted passwords using `bcrypt`.  

### APIs:  
- Open Library API for fetching book covers. 
