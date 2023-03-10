import React, { useEffect, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "./firebase";
import {
  getDocs,
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import Header from "./components/Header";
import BookCards from "./components/BookCards";
import Modal from "./components/Modal";
import styled from "styled-components";

function App() {
  const [bookList, setBookList] = useState(null);

  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookPages, setBookPages] = useState(0);
  const [bookRead, setBookRead] = useState(false);

  const [currUser, setCurrUser] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrUser(user);
        getBooksFromDb();
      } else {
        setCurrUser(null);
        setBookList(null);
      }
    });
    return unsubscribe;
  }, []);

  const booksCollectionRef = collection(db, "books");

  // TODO: this can be improved so that it gets books automatically everytime something is updated
  const getBooksFromDb = useCallback(async () => {
    try {
      const q = query(
        booksCollectionRef,
        where("userId", "==", auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const filteredData = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setBookList(filteredData);
    } catch (error) {
      console.error(error);
    }
  }, [booksCollectionRef]);


  // TODO: add and order by timestamp
  const submitBook = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        await addDoc(booksCollectionRef, {
          title: bookTitle,
          author: bookAuthor,
          pages: bookPages,
          read: bookRead,
          userId: auth.currentUser.uid,
        });
        getBooksFromDb();
      } catch (error) {
        console.error(error);
      }
    },
    [
      booksCollectionRef,
      bookTitle,
      bookAuthor,
      bookPages,
      bookRead,
      getBooksFromDb,
    ]
  );

  const updateBook = useCallback(async (id, readStatus) => {
    const bookDoc = doc(db, "books", id);
    try {
      await updateDoc(bookDoc, {
        read: !readStatus,
      });
      getBooksFromDb();
    } catch (error) {
      console.error(error);
    }
  }, []);

  const deleteBook = useCallback(async (id) => {
    const bookDoc = doc(db, "books", id);
    try {
      await deleteDoc(bookDoc);
      getBooksFromDb();
    } catch (error) {
      console.error(error);
    }
  }, []);

  return (
    <>
      <Header currUser={currUser} />
      <Modal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        submitBook={submitBook}
        setBookTitle={setBookTitle}
        setBookAuthor={setBookAuthor}
        setBookPages={setBookPages}
        setBookRead={setBookRead}
      />
      <BookCards
        bookList={bookList}
        deleteBook={deleteBook}
        updateBook={updateBook}
        setIsModalOpen={setIsModalOpen}
      />
    </>
  );
}

export default App;

const AddBook = styled.button`
  padding: 1rem;
`;
