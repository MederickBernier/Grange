import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Checkbox,
  FieldArray,
  FilledButton,
  FilledTextField,
  Form,
  FormField,
  NumberField,
  OutlinedTextField,
  Rating,
  Select,
  SelectItem,
  Switch,
  TextButton,
  type FormErrors,
  type FormValues,
} from '../src';

/**
 * The last of phase 1, and deliberately the smallest thing that is still useful.
 *
 * `Form` is not a form-state library. It holds no values, has no notion of touched or dirty, and
 * re-renders nothing as you type. What it does is the awkward part: it reads the values out of
 * `FormData` on submit — the browser's own answer to what is in a form, and therefore already
 * right about checkboxes, radios, multiple selects and files — and it distributes an error map
 * to the fields by name.
 *
 * That second part is the useful one. Every field here is built on a React Aria hook, and those
 * hooks read `FormValidationContext` and look themselves up in it by `name`. So errors go in at
 * the top and come out under the right fields, with no wrapper, no cloning and no prop threading.
 */
const meta: Meta = {
  title: 'Components/Form',
  parameters: { layout: 'padded' },
};
export default meta;

const frame = { maxWidth: 420 };

/** Submit it empty and watch the messages land under the fields that caused them. */
export const Validation: StoryObj = {
  render: function Render() {
    const [submitted, setSubmitted] = useState<FormValues | null>(null);

    const validate = (values: FormValues): FormErrors | void => {
      const problems: FormErrors = {};
      if (!values.email) problems.email = 'An email address is required';
      else if (!String(values.email).includes('@')) problems.email = 'That does not look like an email';
      if (!values.size) problems.size = 'Pick a size';
      if (Number(values.quantity) > 10) problems.quantity = 'Ten is the most we can send';
      if (!values.terms) problems.terms = 'The terms have to be accepted';
      if (Object.keys(problems).length > 0) return problems;
    };

    return (
      <div style={frame}>
        <Form
          aria-label="Order"
          validate={validate}
          onSubmit={(values, event) => {
            event.preventDefault();
            setSubmitted(values);
          }}
          actions={
            <>
              <TextButton type="reset">Reset</TextButton>
              <FilledButton type="submit">Place order</FilledButton>
            </>
          }
        >
          <FilledTextField label="Email" name="email" type="email" />
          <Select label="Size" name="size" placeholder="Choose one">
            <SelectItem key="s">Small</SelectItem>
            <SelectItem key="m">Medium</SelectItem>
            <SelectItem key="l">Large</SelectItem>
          </Select>
          <NumberField label="Quantity" name="quantity" defaultValue={1} minValue={1} />
          <Checkbox name="terms" value="yes">
            I accept the terms
          </Checkbox>
        </Form>

        {submitted && (
          <pre className="sb-label" style={{ marginTop: 16, whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(submitted, null, 2)}
          </pre>
        )}
      </div>
    );
  },
};

/**
 * Errors from elsewhere — a server, usually — go in through `errors`. An error the form found
 * itself clears as soon as that field is edited; an external one stays until the app clears it,
 * because only the app knows whether it is still true.
 */
export const ServerErrors: StoryObj = {
  render: function Render() {
    const [errors, setErrors] = useState<FormErrors>({});
    return (
      <div style={frame}>
        <Form
          aria-label="Account"
          errors={errors}
          onSubmit={(values, event) => {
            event.preventDefault();
            // What a failed request would come back with.
            setErrors(
              String(values.username) === 'ada' ? { username: 'That username is taken' } : {},
            );
          }}
          actions={<FilledButton type="submit">Create account</FilledButton>}
        >
          <FilledTextField
            label="Username"
            name="username"
            supportingText="Try “ada”, which the server rejects"
          />
          <OutlinedTextField label="Password" name="password" type="password" />
        </Form>
      </div>
    );
  },
};

/**
 * `FormField` is for a control that brings no label of its own: a third-party picker, or a bare
 * input. Every field in this library already labels itself, so this is not for them.
 */
export const CustomControls: StoryObj = {
  render: () => (
    <div style={frame}>
      <Form aria-label="Preferences" actions={<FilledButton type="submit">Save</FilledButton>}>
        <FormField label="Accent colour" supportingText="A plain input, labelled by the wrapper">
          {(props) => <input {...props} type="color" defaultValue="#6750a4" name="accent" />}
        </FormField>
        <FormField label="Volume" error errorText="Pick something quieter">
          {(props) => <input {...props} type="range" name="volume" defaultValue={90} />}
        </FormField>
        <FormField supportingText="A control that labels itself needs no render function">
          <Switch name="digest" value="yes">
            Weekly digest
          </Switch>
        </FormField>
        <FormField label="How did we do?">
          <Rating name="score" defaultValue={4} />
        </FormField>
      </Form>
    </div>
  ),
};

/**
 * `FieldArray` owns the rows — how many, their order, and a stable key each — and deliberately
 * not their values. The inputs stay ordinary named inputs, so the form reads them out of
 * `FormData` with everything else.
 *
 * The stable keys are the point: removing the second of three rows with index keys would make
 * React reuse the third row's DOM for the second, moving the caret to a different field.
 */
export const Repeating: StoryObj = {
  render: function Render() {
    const [submitted, setSubmitted] = useState<FormValues | null>(null);
    return (
      <div style={frame}>
        <Form
          aria-label="Addresses"
          onSubmit={(values, event) => {
            event.preventDefault();
            setSubmitted(values);
          }}
          actions={<FilledButton type="submit">Save</FilledButton>}
        >
          <FieldArray name="address" defaultCount={1} min={1} max={4}>
            {(rows, add, canAdd) => (
              <>
                {rows.map((row) => (
                  <div key={row.key} className="sb-row" style={{ gap: 8, alignItems: 'flex-start' }}>
                    <FilledTextField label={`City ${row.index + 1}`} name={row.fieldName('city')} />
                    <FilledTextField label="Postcode" name={row.fieldName('postcode')} />
                    <TextButton size="xs" disabled={row.isFirst} onClick={row.moveUp}>
                      Up
                    </TextButton>
                    <TextButton size="xs" disabled={row.isLast} onClick={row.moveDown}>
                      Down
                    </TextButton>
                    <TextButton size="xs" disabled={rows.length === 1} onClick={row.remove}>
                      Remove
                    </TextButton>
                  </div>
                ))}
                <TextButton disabled={!canAdd} onClick={add}>
                  Add an address
                </TextButton>
              </>
            )}
          </FieldArray>
        </Form>

        {submitted && (
          <pre className="sb-label" style={{ marginTop: 16, whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(submitted, null, 2)}
          </pre>
        )}
      </div>
    );
  },
};

/** The browser can validate instead, which is what `native` is for. */
export const NativeValidation: StoryObj = {
  render: () => (
    <div style={frame}>
      <Form
        aria-label="Subscribe"
        validationBehavior="native"
        actions={<FilledButton type="submit">Subscribe</FilledButton>}
      >
        <FilledTextField
          label="Email"
          name="email"
          type="email"
          required
          validationBehavior="native"
          supportingText="The browser shows its own bubble here"
        />
      </Form>
    </div>
  ),
};
