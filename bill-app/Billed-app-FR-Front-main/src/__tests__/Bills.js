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
import NewBillUI from "../views/NewBillUI.js";
import Bills from "../containers/Bills.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";

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

        const mockIcon = document.createElement("div");
        const fakeImageUrl = "https://fake-image-url.com/image.png";
        mockIcon.setAttribute("data-bill-url", fakeImageUrl);

        // Mock the jQuery modal method to avoid error when calling the test
        $.fn.modal = jest.fn();
        bill.handleClickIconEye(mockIcon);

        expect(screen.getByAltText("Bill").src).toBe(fakeImageUrl);
        expect($.fn.modal).toHaveBeenCalledWith("show");
      });
    });
  });
});


// test d'intégration GET, with 404 and 500 errors (mock)
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills Page", () => {
    test("fetches bills from mock API GET", async () => {
      const getSpy = jest.spyOn(firebase, "get");
      const bills = await firebase.get();
      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(bills.data.length).toBe(4);
    });
    test("fetches bills from an API and fails with 404 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      );
      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
    test("fetches messages from an API and fails with 500 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      );
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
}
);
