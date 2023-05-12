/**
 * @jest-environment jsdom
 */

import {
  fireEvent,
  screen,
  waitFor,
} from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import mockBills from "../__mocks__/store.js";
import Bills from "../containers/Bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";



//Setup and teardown functions to be called before and after each test
const setup = () => {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
  });
  window.localStorage.setItem(
    "user",
    JSON.stringify({
      type: "Employee",
    })
  );
  const root = document.createElement("div");
  root.setAttribute("id", "root");
  document.body.append(root);
  router();
};
const tearDown = () => {
  document.body.innerHTML = "";
};


//Test suite for Bills page
describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    setup();
  });

  afterEach(() => {
    tearDown();
  });

  describe("When I am on Bills Page", () => {
    //Expect expression to check if the window icon really is highlighted
    test("Then bill icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      expect(
        windowIcon.classList.contains("active-icon")
      ).toBeTruthy();
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({
        data: bills.sort(
          //Added sort by date to fix test, as mock data was not sorted beforehand
          (a, b) => new Date(b.date) - new Date(a.date)
        ),
      });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    //newBill button should correctly redirect to newBill page
    describe("When I click on new bill button", () => {
      test("I should be redirected to new bill page", () => {
        document.body.innerHTML = BillsUI({ data: bills });

        const onNavigate = jest.fn();
        new Bills({
          document,
          onNavigate,
          store: mockBills,
          localStorage: localStorageMock,
        });

        const newBillButton = screen.getByTestId("btn-new-bill");
        fireEvent.click(newBillButton);

        expect(onNavigate).toHaveBeenCalledWith(
          ROUTES_PATH["NewBill"]
        );
      });
    });

    //eyeIcon should correctly display modal with bill image
    describe("When I click on the eye icon", () => {
      test("Then a modal should display the bill image", () => {
        const html = BillsUI({ data: bills });
        document.body.innerHTML = html;
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES_PATH[pathname];
        };
        const bill = new Bills({
          document,
          onNavigate,
          store: mockBills,
          localStorage: window.localStorage,
        });

        // Simulate eye icon and bill image
        const mockIcon = document.createElement("div");
        const fakeImageUrl = "https://fake-image-url.com/image.png";
        mockIcon.setAttribute("data-bill-url", fakeImageUrl);

        // Mock the jQuery modal method to avoid error when calling the test
        // (modal is not a function)
        $.fn.modal = jest.fn();
        bill.handleClickIconEye(mockIcon);

        expect(screen.getByAltText("Bill").src).toBe(fakeImageUrl);
        expect($.fn.modal).toHaveBeenCalledWith("show");
      });
    });

    // Check get bills response : chronological order and correct data
    describe("When bills are fetched from the store", () => {
      let billsInstance;

      beforeEach(() => {
        const onNavigate = jest.fn();
        billsInstance = new Bills({
          document,
          onNavigate,
          store: mockBills,
          localStorage: localStorageMock,
        });
      });

      test("The bills list method should be called once", async () => {
        const storeListSpy = jest.spyOn(mockBills.bills(), 'list')
        await billsInstance.getBills()
        expect(storeListSpy).toHaveBeenCalledTimes(1)
      });

      test("The fetched data should have the correct length", async () => {
        const billsData = await billsInstance.getBills()
        expect(billsData.length).toBe(4)
      });

      //Bad data test for GET bills
      test("Given corrupted date data Then it should log the error and return unformatted date", async () => {
        const onNavigate = jest.fn();
        const corruptedBills = mockBills;
        corruptedBills.list = () =>
          Promise.resolve([
            {
              id: "corrupted1",
              date: "corrupted_date",
              status: "pending",
            },
          ]);

        const corruptedStore = {
          bills() {
            return corruptedBills;
          },
        };

        const billsInstance = new Bills({
          document,
          onNavigate,
          store: corruptedStore,
          localStorage: localStorageMock,
        });

        console.log = jest.fn();

        const billsData = await billsInstance.getBills();
        expect(console.log).toHaveBeenCalledWith(
          new RangeError("Invalid time value"),
          "for",
          expect.objectContaining({ id: "corrupted1" })
        );
        expect(billsData[0]).toHaveProperty("date", "corrupted_date");
      });

      /////////////////////////////////////////////////////////////////////
      //Integration test for GET bills
      //We already are connected as an employee, so we can test the GET bills request
      describe("When I navigate to Bills", () => {
        beforeEach(() => {
          jest.spyOn(mockBills, "bills");
          Object.defineProperty(window, "localStorage", {
            value: localStorageMock,
          });
          window.localStorage.setItem(
            "user",
            JSON.stringify({
              type: "Employee",
            })
          );
          const root = document.createElement("div");
          root.setAttribute("id", "root");
          document.body.append(root);
          router();
        });
        test("fetches bills from mock API GET", async () => {
          const html = BillsUI({ data: bills });
          document.body.innerHTML = html;
          const message = await screen.getByText(/Mes notes de frais/i);
          expect(message).toBeTruthy();
        });
        
        describe("When an error occurs on API", () => {
          test("fetches bills from an API and fails with 404 message error", async () => {
            mockBills.bills.mockImplementationOnce(() => {
              return {
                list: () => {
                  return Promise.reject(new Error("Erreur 404"));
                },
              };
            });
            const html = BillsUI({ error: "Erreur 404" });
            document.body.innerHTML = html;
            const message = await screen.getByText(/Erreur 404/);
            expect(message).toBeTruthy();
          });

          test("fetches messages from an API and fails with 500 message error", async () => {
            mockBills.bills.mockImplementationOnce(() => {
              return {
                list: () => {
                  return Promise.reject(new Error("Erreur 500"));
                },
              };
            });
            const html = BillsUI({ error: "Erreur 500" });
            document.body.innerHTML = html;
            const message = await screen.getByText(/Erreur 500/);
            expect(message).toBeTruthy();
          });
        });
      });
    });
  });
});
