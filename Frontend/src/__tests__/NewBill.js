/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from '@testing-library/dom'
import '@testing-library/jest-dom'
import NewBillUI from '../views/NewBillUI.js'
import NewBill from '../containers/NewBill.js'
import BillsUI from '../views/BillsUI.js'
import { ROUTES, ROUTES_PATH } from '../constants/routes.js'
import { localStorageMock } from '../__mocks__/localStorage.js'
import mockStore from '../__mocks__/store'
import { bills } from '../fixtures/bills.js'
import router from '../app/Router.js'

jest.mock('../app/store', () => mockStore)


describe("Given I am connected as an employee", () => {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock })

  window.localStorage.setItem(
    'user',
    JSON.stringify({
      type: 'Employee',
    })
  )

  const onNavigate = (pathname) => {
    document.body.innerHTML = ROUTES({ pathname, data: bills })
  }

  describe('When I am on NewBill Page', () => {
    test('Then email icon in vertical layout should be highlighted', async () => {
      const root = document.createElement('div')
      root.setAttribute('id', 'root')
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const emailIcon = screen.getByTestId('icon-mail')

      expect(emailIcon).toHaveClass('active-icon')

      document.body.removeChild(root)
    })
  })
  describe('When I am on NewBill page and I upload a file with an extension other than jpg, jpeg or png', () => {
    test('Then an error message for the file input should be displayed', () => {
      document.body.innerHTML = NewBillUI()

      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        bills: bills,
        localStorage: window.localStorage,
      })

      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))

      const fileInput = screen.getByLabelText('Justificatif')
      fileInput.addEventListener('change', handleChangeFile)

      fireEvent.change(fileInput, {
        target: {
          files: [
            new File(['test'], 'test.pdf', {
              type: 'application/pdf',
            }),
          ],
        },
      })

      expect(handleChangeFile).toHaveBeenCalled()

      expect(fileInput.files[0].name).toBe('test.pdf')

      const errorMessage = screen.getByTestId('file-error-message')

      expect(errorMessage).not.toHaveClass('hidden')
    })
  })

  describe('When I am on the NewBill page and I upload a file with a jpg, jpeg or png extension', () => {
    test('Then no error message should be displayed', () => {
      document.body.innerHTML = NewBillUI()

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        bills: bills,
        localStorage: window.localStorage,
      })

      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))

      const fileInput = screen.getByLabelText('Justificatif')
      fileInput.addEventListener('change', handleChangeFile)

      fireEvent.change(fileInput, {
        target: {
          files: [
            new File(['test'], 'test.jpg', {
              type: 'image/jpeg',
            }),
          ],
        },
      })

      expect(handleChangeFile).toHaveBeenCalled()

      expect(fileInput.files[0].name).toBe('test.jpg')

      const errorMessage = screen.getByTestId('file-error-message')

      expect(errorMessage).toHaveClass('hidden')
    })
  })

  describe('When I am on NewBill page, I filled in the form correctly and I clicked on submit button', () => {
    test('Then Bills page should be rendered', () => {
      document.body.innerHTML = NewBillUI()

      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      })

      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
      newBill.fileName = 'test.jpg'

      const formNewBill = screen.getByTestId('form-new-bill')
      formNewBill.addEventListener('submit', handleSubmit)

      fireEvent.submit(formNewBill)

      expect(handleSubmit).toHaveBeenCalled()

      expect(screen.getByText('Mes notes de frais')).toBeTruthy()
    })
  })

})



//*********************************** Test d'intégration ****************************************************
describe("Given I am a user connected as en Employee", () => {
  describe("When I valid bill form", () => {
    test('Then a bill is created', async () => {
      document.body.innerHTML = NewBillUI()
      const newBill = new NewBill({
        document, onNavigate, store: null, localStorage: window.localStorage
      })

      //new bill with handleSubmit
      const submit = screen.queryByTestId('form-new-bill')
      const billTest = {

        name: "testing",
        date: "2001-04-15",
        amount: 400,
        type: "Hôtel et logement",
        commentary: "séminaire billed",
        pct: 25,
        vat: 12,
        commentary: "test",
        fileName: "testing",
        fileUrl: 'testing.jpg'
      }


      //click submit
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))

      //apply to the DOM
      newBill.createBill = (newBill) => newBill
      document.querySelector(`select[data-testid="expense-type"]`).value = billTest.type
      document.querySelector(`input[data-testid="expense-name"]`).value = billTest.name
      document.querySelector(`input[data-testid="datepicker"]`).value = billTest.date
      document.querySelector(`input[data-testid="amount"]`).value = billTest.amount
      document.querySelector(`input[data-testid="vat"]`).value = billTest.vat
      document.querySelector(`input[data-testid="pct"]`).value = billTest.pct
      document.querySelector(`textarea[data-testid="commentary"]`).value = billTest.commentary
      newBill.fileUrl = billTest.fileUrl
      newBill.fileName = billTest.fileName

      submit.addEventListener('click', handleSubmit)

      fireEvent.click(submit)

      //verify if handleSubmit was called
      expect(handleSubmit).toHaveBeenCalled()

    })
  })
})

describe("When an error occurs on API", () => {
  beforeEach(() => {
    jest.spyOn(mockStore, "bills")
    Object.defineProperty(
      window,
      'localStorage',
      { value: localStorageMock }
    )
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee',
      email: "a@a"
    }))
    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.appendChild(root)

  })
  test("fetches bills from an API and fails with 404 message error", async () => {

    mockStore.bills.mockImplementationOnce(() => {
      return {
        list: () => {
          return Promise.reject(new Error("Erreur 404"))
        }
      }
    })
    const html = BillsUI({ error: "Erreur 404" })
    document.body.innerHTML = html
    const message = await screen.getByText(/Erreur 404/)
    expect(message).toBeTruthy()
  })

  test("fetches messages from an API and fails with 500 message error", async () => {

    mockStore.bills.mockImplementationOnce(() => {
      return {
        list: () => {
          return Promise.reject(new Error("Erreur 500"))
        }
      }
    })


    const html = BillsUI({ error: "Erreur 500" })
    document.body.innerHTML = html
    const message = await screen.getByText(/Erreur 500/)
    expect(message).toBeTruthy()
  })
})
