/* eslint-disable no-unused-vars */
const React = window.React;
const ReactDOM = window.ReactDOM;
const styles = {
  container: 'w-full h-full min-h-screen bg-gray-100 justify-center items-center flex',
  formContainer: 'w-full flex-col py-3 px-3 max-w-lg bg-white rounded-lg shadow-sm flex justify-center items-center gap-4',
  select: 'w-full focus:border-blue-500  bg-blue-500 rounded-lg py-2 px-3 text-white font-semibold leading-tight focus:outline-none focus:shadow-outline',
  inputContainer: 'w-full flex flex-col justify-center',
  deleteIcon: 'absolute right-4 top-2 w-10 h-10 px-2 rounded-full cursor-pointer hover:bg-blue-200 py-2 fill-blue-600 hover:fill-blue-700',
  fieldContainer: 'w-full flex flex-col gap-3 border px-2 py-2 rounded-lg shadow-sm relative',
  checkboxDiv: 'w-full flex gap-2 ',
  button: 'w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline',
  inputText: 'w-full focus:border-blue-500 invalid:border-red-500 border border-gray-300 rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
};
// Array<{value?:string,name:string,required?:boolean,label?:string}>

function MyComponent () {
  /**
   * @type {[Array<{value?:string,name:string,filledByUser?:boolean,label?:string}>,Function]}
   */
  const [veURL, setVeURL] = React.useState('');
  const [tennantID, setTennantID] = React.useState([]);
  const [selectedFields, setSelectedFields] = React.useState([
    {
      name: 'addressStreet',
      label: 'addressStreet'
    }
  ]);
  const [customFields, setCustomFields] = React.useState([]);
  const availableOption = [
    'firstName', 'lastName', 'email', 'addressStreet', 'addressCity', 'addressPostalCode', 'addressState', 'phoneNumber', 'phoneType', 'customerId'
  ];
  const filterOptions = availableOption.filter(option => !selectedFields.some(field => field.name === option));
  const availableCustomOptions = ['customField1', 'customField2', 'customField3'];
  const filterCustomOptions = availableCustomOptions.filter(option => !customFields.some(field => field.name === option));
  function handleSelectChange (event) {
    const value = event.target.value;
    if (availableOption.includes(value)) {
      setSelectedFields([...selectedFields, { name: value, label: value }]);
    } else if (availableCustomOptions.includes(value)) {
      setCustomFields([...customFields, { name: value, label: value + 'Label' }]);
    }
    event.target.value = '';
  }
  function onTennantIDChange (event) {
    setTennantID(event.target.value);
  }
  function onVeURLChange (event) {
    setVeURL(event.target.value);
  }
  const availableSelectedFields = availableCustomOptions.length + filterOptions.length;
  const generatedURL = React.useMemo(() => {
    const allFields = [];
    for (const field of selectedFields) {
      const data = { name: field.name, label: field.label };
      if (!field.filledByUser) {
        data.value = field.value;
      } else {
        if (field.required) data.required = true;
      }
      allFields.push(data);
    }
    for (const field of customFields) {
      const data = { name: field.name, label: field.label };
      if (!field.filledByUser) {
        data.value = field.value;
      } else {
        if (field.required) data.required = true;
      }
      allFields.push(data);
    }
    const data = {
      v: veURL || '',
      t: tennantID || '',
      ud: allFields
    };
    const stringify = JSON.stringify(data);
    const encoded = btoa(stringify);
    return `http://127.0.0.1:5501/short-url/index.html?d=${encoded}`;
  }, [veURL, tennantID, selectedFields, customFields]);
  return (
    <div className={styles.container}>
      <form className={styles.formContainer}>
        <h1 className='text-2xl font-bold'>Custom URL Generator</h1>
        <div className={styles.inputContainer}>
          <label>Generatied URL ({generatedURL.length})</label>
          <input readOnly className={styles.inputText} value={generatedURL} type='text' />
        </div>
        <div className={styles.inputContainer}>
          <label htmlFor='url'>veURL</label>
          <input onChange={onVeURLChange} className={styles.inputText} value={veURL} required type='text' name='url' />
        </div>

        <div className={styles.inputContainer}>
          <label htmlFor='tennantID'>Tennant ID</label>
          <input onChange={onTennantIDChange} className={styles.inputText} value={tennantID} required type='text' name='tennantID' />
        </div>
        <select className={styles.select} onChange={handleSelectChange} disabled={availableSelectedFields === 0}>
          <option value=''>Add New Field</option>
          {filterOptions.map((option, index) => {
            return <option key={index + '-option'} value={option}>{option}</option>;
          })}
          {filterCustomOptions.map((option, index) => {
            return <option key={index + '-custom-option'} value={option}>{option}</option>;
          })}
        </select>
        <SelectedFieldsComponent selectedFields={selectedFields} setSelectedFields={setSelectedFields} />
        <SelectedFieldsComponent selectedFields={customFields} setSelectedFields={setCustomFields} custom />

        <button className={styles.button} type='submit'>Submit</button>
      </form>
    </div>
  );
}
function SelectedFieldsComponent ({ setSelectedFields, selectedFields, custom }) {
  return (
    selectedFields.map((field, index) => {
      return (
        <div key={index + '-selected-field' + (custom ? '-custoom' : '')} className={styles.fieldContainer}>
          <DeleteIcon onClick={() => setSelectedFields(selectedFields.filter((_, i) => i !== index))} />
          <div>
            Field: <strong>{field.name}</strong>
          </div>
          <div className={styles.inputContainer}>
            <label htmlFor={field.name}>Label</label>
            <input
              onChange={(event) => {
                const value = event.target.value;
                setSelectedFields(prev => {
                  const newState = [...prev];
                  newState[index].label = value;
                  return newState;
                });
              }} className={styles.inputText} type='text' value={field.label} name={field.name}
            />

          </div>
          {/* checkbox */}
          <div className={styles.checkboxDiv}>
            <input
              onChange={(event) => {
                const value = event.target.checked;
                setSelectedFields(prev => {
                  const newState = [...prev];
                  newState[index].filledByUser = value;
                  return newState;
                });
              }} type='checkbox' name={field.name}
            />
            <label htmlFor={field.name}>Filled By User</label>
          </div>
          {!field.filledByUser && (
            <div className={styles.inputContainer}>
              <label htmlFor={field.name}>Value</label>
              <input
                onChange={(event) => {
                  const value = event.target.value;
                  setSelectedFields(prev => {
                    const newState = [...prev];
                    newState[index].value = value;
                    return newState;
                  });
                }} className={styles.inputText} type='text' value={field.value} name={field.name}
              />
            </div>
          )}
          {field.filledByUser && (
            <div className={styles.checkboxDiv}>
              <input
                onChange={(event) => {
                  const value = event.target.checked;
                  setSelectedFields(prev => {
                    const newState = [...prev];
                    newState[index].required = value;
                    return newState;
                  });
                }} type='checkbox' name={field.name}
              />
              <label htmlFor={field.name}>Is Required Field?</label>
            </div>
          )}
        </div>
      );
    })
  );
}
function DeleteIcon ({ onClick }) {
  return (
    <div onClick={onClick} className={styles.deleteIcon}>
      <svg viewBox='0 0 24 24'>
        <path d='M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12 1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z' />
      </svg>
    </div>
  );
}
class RootComponent extends React.Component {
  render () {
    return <MyComponent />;
  }
}

const domContainer = document.querySelector('#injected-react-content');
ReactDOM.render(React.createElement(RootComponent), domContainer);
