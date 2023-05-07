/**
 * @jest-environment jsdom
 */

import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { fireEvent, waitFor, screen } from "@testing-library/dom";
import mockedStore from "../__mocks__/store.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import "@testing-library/jest-dom/extend-expect";

describe("Given I am connected as an employee", () => {
  //////////////////////////////////////////////
  //Set up for all tests
  describe("When I am on NewBill Page", () => {
    // Set email to local storage before each test
    beforeEach(() => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employé",
          email: "employé@emailBill.com",
        })
      );
    });
    //Reset after each test
    afterEach(() => {
      window.localStorage.clear();
    });


    //Form render check (i added the expect)
    test("Then the form should render correctly", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      const form = screen.getByTestId("form-new-bill");
      expect(form).toBeTruthy();
    });

    //////////////////////////////////////////////////////////// 
    ////Use txt file to check if non-image files really can't be uploaded
    test("Then the file input should not accept non-image files", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES_PATH[pathname];
      };
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockedStore,
        localStorage: localStorageMock,
      });

      const fileInput = screen.getByTestId("file");
      const file = new File(["text file content"], "test.txt", {
        type: "text/plain",
      });

      fireEvent.change(fileInput, {
        target: { files: [file] },
      });

      expect(fileInput.value).toBe("");
    });

    //////////////////////////////////////////////////////////// 
    ////Check img file name
    test("Then the image files should be uploaded correctly", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES_PATH[pathname];
      };
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockedStore,
        localStorage: localStorageMock,
      });

      const fileInput = screen.getByTestId("file");
      const file = new File(["image file content"], "test.png", {
        type: "image/png",
      });

      fireEvent.change(fileInput, {
        target: { files: [file] },
      });

      expect(fileInput.files[0].name).toBe("test.png");
    });

    //////////////////////////////////////////////////////////// 
    ////Error should be caught and logged if file upload fails
    test("Then an error should be caught and logged if file upload fails", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES_PATH[pathname];
      };
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockedStore,
        localStorage: localStorageMock,
      });

      const fileInput = screen.getByTestId("file");
      const file = new File(["image content"], "image.png", {
        type: "image/png",
      });

      // Force file upload to fail
      const createSpy = jest.spyOn(newBill.store, "bills").mockImplementation(() => ({
        create: () => Promise.reject(new Error("File upload failed")),
      }));

      //Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => { });

      fireEvent.change(fileInput, {
        target: { files: [file] },
      });

      //Wait for file upload to fail
      await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalled());

      //Check if error is logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(new Error("File upload failed"));

      //Reinitialise spies
      createSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    ////////////////////////////////////////////////////////
    //Post new bill integration test
    describe("Given I am a user connected as Employee, and a user post a newBill", () => {
      test("Add a bill from mock API POST", async () => {
        const postSpy = jest.spyOn(mockedStore, "bills");
        const bill = {
          id: "47qAXb6fIm2zOKkLzMro",
          vat: "80",
          fileUrl: "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
          status: "pending",
          type: "Hôtel et logement",
          commentary: "séminaire billed",
          name: "encore",
          fileName: "preview-facture-free-201801-pdf-1.jpg",
          date: "2004-04-04",
          amount: 400,
          commentAdmin: "ok",
          email: "a@a",
          pct: 20,
        };
        const postBill = await mockedStore.bills().update(bill);
        expect(postSpy).toHaveBeenCalledTimes(1);
        expect(postBill).toStrictEqual(bill);
      });

      ////////////////////////////////////////////////////////
      //API error test
      describe("When an error occurs on API", () => {
        let onNavigate;
        beforeEach(() => {
          window.localStorage.setItem(
            "user",
            JSON.stringify({
              type: "Employee",
            })
          );

          document.body.innerHTML = NewBillUI();
          onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES_PATH[pathname];
          };
        });


        //////////////////////////////////////////////////////////// 
        ////Test if 404 error is caught and logged
        test("Then a 404 error should be caught and logged", async () => {
          const html = NewBillUI();
          document.body.innerHTML = html;
          const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES_PATH[pathname];
          };
          const newBill = new NewBill({
            document,
            onNavigate,
            store: mockedStore,
            localStorage: localStorageMock,
          });

          const form = screen.getByTestId("form-new-bill");

          // Force store.bills().update to return a 404 error
          const updateSpy = jest.spyOn(newBill.store, "bills").mockImplementation(() => ({
            update: () => Promise.reject({ message: "404 error", status: 404 }),
          }));

          // Spy on console.error
          const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => { });

          // Submit the form
          fireEvent.submit(form);

          // Wait for the error to be caught
          await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalled());

          // Check if error is logged
          expect(consoleErrorSpy).toHaveBeenCalledWith({ message: "404 error", status: 404 });

          // Restore spies
          updateSpy.mockRestore();
          consoleErrorSpy.mockRestore();
        });

        //////////////////////////////////////////////////////////// 
        ////Test if 500 error is caught and logged
        test("Then a 500 error should be caught and logged", async () => {
          const html = NewBillUI();
          document.body.innerHTML = html;
          const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES_PATH[pathname];
          };
          const newBill = new NewBill({
            document,
            onNavigate,
            store: mockedStore,
            localStorage: localStorageMock,
          });

          const form = screen.getByTestId("form-new-bill");

          const updateSpy = jest.spyOn(newBill.store, "bills").mockImplementation(() => ({
            update: () => Promise.reject({ message: "500 error", status: 500 }),
          }));

          const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => { });

          fireEvent.submit(form);

          await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalled());

          expect(consoleErrorSpy).toHaveBeenCalledWith({ message: "500 error", status: 500 });

          updateSpy.mockRestore();
          consoleErrorSpy.mockRestore();
        });
      });
      
      ////////////////////////////////////////////////////////
      // Successful submission test: redirect to bills page
      describe("When the submission is successful", () => {
        let onNavigate;
        beforeEach(() => {
          window.localStorage.setItem(
            "user",
            JSON.stringify({
              type: "Employee",
            })
          );

          document.body.innerHTML = NewBillUI();
          onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES_PATH[pathname];
          };
        });
        test("Then updateBill should navigate to Bills page", async () => {
          const html = NewBillUI();
          document.body.innerHTML = html;
          const onNavigate = jest.fn((pathname) => {
            document.body.innerHTML = ROUTES_PATH[pathname];
          });
          const newBill = new NewBill({
            document,
            onNavigate,
            store: mockedStore,
            localStorage: localStorageMock,
          });
  
          const form = screen.getByTestId("form-new-bill");
  
          const updateSpy = jest.spyOn(newBill.store, "bills").mockImplementation(() => ({
            update: () => Promise.resolve(),
          }));
  
          fireEvent.submit(form);
  
          await waitFor(() => expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills']));
  
          updateSpy.mockRestore();
        });
      });
    });
  });
});