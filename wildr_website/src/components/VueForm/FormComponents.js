import VueFormGenerator from "vue-form-generator";
import {countryList} from "@/components/VueForm/Countries";

export function Label(label, title = false) {
    return {
        type: "label",
        label,
        featured: title,
    }
}

export function BasicInput(model, label, hint) {
    return {
        type: "input",
        inputType: "text",
        hint,
        model,
        placeholder: model.replace(/([A-Z])/g, (i) => ` ${i}`).replace(/^./, (i) => i.toUpperCase()).trim(),
        label,
        readonly: false,
        featured: true,
        required: true,
        disabled: false,
        validator: VueFormGenerator.validators.string
    };
}

export function BasicOptionalInput(model, label, hint) {
    return {
        type: "input",
        inputType: "text",
        hint,
        model,
        placeholder: model.replace(/([A-Z])/g, (i) => ` ${i}`).replace(/^./, (i) => i.toUpperCase()).trim(),
        label,
        readonly: false,
        featured: true,
        disabled: false,
    };
}

export function EmailInput(hint = null) {
    return {
        type: "input",
        inputType: "text",
        hint,
        model: "email",
        placeholder: "Email Address",
        label: "Email Address",
        readonly: false,
        featured: true,
        required: true,
        disabled: false,
        validator: VueFormGenerator.validators.email
    };
}

export function NumberInput(model, label, hint) {
    return {
        type: "input",
        inputType: "number",
        model,
        placeholder: model.replace(/([A-Z])/g, (i) => ` ${i}`).replace(/^./, (i) => i.toUpperCase()).trim(),
        label,
        hint,
        readonly: false,
        featured: true,
        required: true,
        disabled: false,
        validator: VueFormGenerator.validators.number
    };
}

export function RadioButtons(model, label, radios, hint) {
    return {
        type: "radios",
        label,
        model,
        hint,
        readonly: false,
        featured: true,
        required: true,
        disabled: false,
        values: radios,
        validator: VueFormGenerator.validators.string
    }
}

export function CheckList(model, label, checkList, hint) {
    let errorMessage = ["Please fill out the required field."]
    return {
        type: "checklist",
        label,
        model,
        hint,
        listBox: true,
        readonly: false,
        featured: true,
        required: true,
        disabled: false,
        values: checkList,
        validator: (value) => value ? value.length === checkList.length ? [] : errorMessage : errorMessage,
    }
}

export function DateInput(model, label, hint) {
    return {
        type: "input",
        inputType: "date",
        label,
        model,
        hint,
        readonly: false,
        featured: true,
        disabled: false,
        validator: VueFormGenerator.validators.date,
        set: function (model, val) {
            model.startDate = new Date(val).valueOf();
        }
    };
}

export function TextAreaInput(model, label, max) {
    return {
        type: "textArea",
        label,
        model,
        hint: max ? `Max ${max} characters` : null,
        max: max,
        readonly: false,
        featured: true,
        disabled: false,
        required: true,
        placeholder: model.replace(/([A-Z])/g, (i) => ` ${i}`).replace(/^./, (i) => i.toUpperCase()).trim(),
        rows: 4,
        validator: VueFormGenerator.validators.string
    }
}

export function SubmitButton(onSubmit) {
    return {
        type: "submit",
        label: "",
        caption: "Submit form",
        validateBeforeSubmit: true,
        onSubmit: onSubmit

    }
}

export function SelectInput(model, label, select, hint) {
    return {
        type: "select",
        label,
        model,
        hint,
        readonly: false,
        featured: true,
        disabled: false,
        required: true,
        values: select,
        validator: (value) => value ? [] : ['Select a country'],
    };
}

export function CountrySelect() {
    return SelectInput("country", "Country/region", countryList, "Selecting the right country helps us better respond to your request")
}

export function UploadButton(label, hint) {
    return {
        model:"file",
        type: 'image',
        label,
        hint,
        featured: true,
        readonly: false,
        preview: false,
        disabled: false,
        hideInput: true,
    }
}