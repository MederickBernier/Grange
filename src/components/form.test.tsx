import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Checkbox,
  FieldArray,
  FilledButton,
  FilledTextField,
  Form,
  FormField,
  GrangeProvider,
  NumberField,
  Select,
  SelectItem,
  form as formSpec,
  readValues,
} from '../index';

const field = (name: string) => screen.getByLabelText(name) as HTMLInputElement;

describe('Form', () => {
  it('keeps the chosen gaps on the 4dp grid, since there is no spacing scale yet', () => {
    expect(formSpec.gap % 4).toBe(0);
    expect(formSpec.actionGap % 4).toBe(0);
  });

  it('turns the browser validation off when the fields do the messaging', () => {
    const { container, unmount } = render(
      <Form aria-label="Details">
        <FilledTextField label="Email" name="email" required />
      </Form>,
    );
    // The two cannot both be in charge: leaving it on puts a bubble over the field's own message.
    expect((container.querySelector('form') as HTMLFormElement).noValidate).toBe(true);
    unmount();

    const native = render(
      <Form aria-label="Details" validationBehavior="native">
        <FilledTextField label="Email" name="email" required />
      </Form>,
    );
    expect((native.container.querySelector('form') as HTMLFormElement).noValidate).toBe(false);
  });

  it('collects the values out of FormData, which is already right about the awkward cases', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((_values, event: React.FormEvent) => event.preventDefault());
    render(
      <Form
        aria-label="Details"
        onSubmit={onSubmit}
        actions={<FilledButton type="submit">Save</FilledButton>}
      >
        <FilledTextField label="Name" name="name" defaultValue="Ada" />
        <NumberField label="Count" name="count" defaultValue={3} />
        <Checkbox name="terms" value="yes">
          Agree
        </Checkbox>
        <Checkbox name="tags" value="a" defaultChecked>
          A
        </Checkbox>
        <Checkbox name="tags" value="b" defaultChecked>
          B
        </Checkbox>
      </Form>,
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));

    const values = onSubmit.mock.calls[0]![0] as Record<string, unknown>;
    expect(values.name).toBe('Ada');
    expect(values.count).toBe('3');
    // Unchecked is absent rather than false, which is the browser's own answer.
    expect(values.terms).toBeUndefined();
    // Two entries under one name become an array.
    expect(values.tags).toEqual(['a', 'b']);
  });

  it('distributes an error to the right field by name, with no wrapper and no cloning', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Form
        aria-label="Details"
        onSubmit={onSubmit}
        validate={(values) => (values.email ? undefined : { email: 'An email is required' })}
        actions={<FilledButton type="submit">Save</FilledButton>}
      >
        <FilledTextField label="Email" name="email" />
        <FilledTextField label="Nickname" name="nickname" />
      </Form>,
    );

    await user.click(screen.getByRole('button', { name: 'Save' }));
    // The submit did not go through, and the message landed under the field it names.
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('An email is required')).toBeTruthy();
    expect(field('Email').getAttribute('aria-invalid')).toBe('true');
    expect(field('Nickname').getAttribute('aria-invalid')).toBeNull();
  });

  it('clears a field error as soon as that field is edited', async () => {
    const user = userEvent.setup();
    render(
      <Form
        aria-label="Details"
        validate={() => ({ email: 'Not an email' })}
        actions={<FilledButton type="submit">Save</FilledButton>}
      >
        <FilledTextField label="Email" name="email" />
      </Form>,
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Not an email')).toBeTruthy();

    /*
     * The form does this part, not React Aria. React Aria clears a context error by noticing the
     * field's value change, which only works for a controlled field; these are ordinary
     * uncontrolled inputs, so the form watches its own input events.
     */
    await user.type(field('Email'), 'a');
    expect(screen.queryByText('Not an email')).toBeNull();
  });

  it('leaves an external error alone while it clears its own', async () => {
    const user = userEvent.setup();
    render(
      <Form
        aria-label="Details"
        errors={{ email: 'Already registered' }}
        validate={() => ({ nickname: 'Taken' })}
        actions={<FilledButton type="submit">Save</FilledButton>}
      >
        <FilledTextField label="Email" name="email" />
        <FilledTextField label="Nickname" name="nickname" />
      </Form>,
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Taken')).toBeTruthy();

    await user.type(field('Nickname'), 'x');
    expect(screen.queryByText('Taken')).toBeNull();

    // The server error is the app's to clear: it knows whether the name is still taken.
    await user.type(field('Email'), 'x');
    expect(screen.getByText('Already registered')).toBeTruthy();
  });

  it('takes errors from outside, such as a server', () => {
    const { rerender } = render(
      <Form aria-label="Details" errors={{ email: 'Already registered' }}>
        <FilledTextField label="Email" name="email" />
      </Form>,
    );
    expect(screen.getByText('Already registered')).toBeTruthy();

    rerender(
      <Form aria-label="Details" errors={{}}>
        <FilledTextField label="Email" name="email" />
      </Form>,
    );
    expect(screen.queryByText('Already registered')).toBeNull();
  });

  it('reaches a select and a number field too, since every field reads the same context', async () => {
    const user = userEvent.setup();
    render(
      <Form
        aria-label="Details"
        validate={() => ({ size: 'Pick a size', count: 'Too few' })}
        actions={<FilledButton type="submit">Save</FilledButton>}
      >
        <Select label="Size" name="size">
          <SelectItem key="s">Small</SelectItem>
          <SelectItem key="l">Large</SelectItem>
        </Select>
        <NumberField label="Count" name="count" />
      </Form>,
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Pick a size')).toBeTruthy();
    expect(screen.getByText('Too few')).toBeTruthy();
  });

  it('submits once the validation passes, and stops marking the fields', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((_values, event: React.FormEvent) => event.preventDefault());
    let required = true;
    render(
      <Form
        aria-label="Details"
        onSubmit={onSubmit}
        validate={() => (required ? { email: 'Required' } : undefined)}
        actions={<FilledButton type="submit">Save</FilledButton>}
      >
        <FilledTextField label="Email" name="email" />
      </Form>,
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).not.toHaveBeenCalled();

    required = false;
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Required')).toBeNull();
  });

  it('clears what it found on reset', async () => {
    const user = userEvent.setup();
    render(
      <Form
        aria-label="Details"
        validate={() => ({ email: 'Required' })}
        actions={
          <>
            <FilledButton type="submit">Save</FilledButton>
            <FilledButton type="reset">Reset</FilledButton>
          </>
        }
      >
        <FilledTextField label="Email" name="email" />
      </Form>,
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Required')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.queryByText('Required')).toBeNull();
  });

  it('reaches its slots and takes its default behaviour from the provider', () => {
    const { container } = render(
      <GrangeProvider
        defaultProps={{ Form: { validationBehavior: 'native' } }}
        classNames={{ Form: { root: 'x-root', actions: 'x-actions' } }}
      >
        <Form aria-label="Details" actions={<FilledButton type="submit">Save</FilledButton>}>
          <FilledTextField label="Email" name="email" />
        </Form>
      </GrangeProvider>,
    );
    expect((container.querySelector('form') as HTMLFormElement).noValidate).toBe(false);
    expect(container.querySelector('.x-root')).toBeTruthy();
    expect(container.querySelector('.x-actions')).toBeTruthy();
  });
});

describe('readValues', () => {
  it('is exported, because a form that posts normally still wants its values', () => {
    render(
      <form data-testid="plain">
        <input name="a" defaultValue="1" />
        <input name="b" defaultValue="2" />
        <input name="b" defaultValue="3" />
      </form>,
    );
    expect(readValues(screen.getByTestId('plain') as HTMLFormElement)).toEqual({ a: '1', b: ['2', '3'] });
  });
});

describe('FormField', () => {
  it('associates a label and a message with a control that has neither', () => {
    render(
      <FormField label="Colour" supportingText="Any hex value">
        {(props) => <input {...props} data-testid="custom" />}
      </FormField>,
    );
    const control = screen.getByTestId('custom');
    // Associated rather than merely adjacent: getByLabelText only finds it if the wiring is real.
    expect(screen.getByLabelText('Colour')).toBe(control);
    const describedBy = control.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!.split(' ')[0]!)?.textContent).toBe('Any hex value');
  });

  it('shows the error in place of the supporting text, and marks the control', () => {
    render(
      <FormField label="Colour" supportingText="Any hex value" error errorText="Not a colour">
        {(props) => <input {...props} data-testid="custom" />}
      </FormField>,
    );
    expect(screen.getByText('Not a colour')).toBeTruthy();
    expect(screen.queryByText('Any hex value')).toBeNull();
    expect(screen.getByTestId('custom').getAttribute('aria-invalid')).toBe('true');
  });

  it('passes required and disabled through to the control', () => {
    render(
      <FormField label="Colour" required disabled>
        {(props) => <input {...props} data-testid="custom" />}
      </FormField>,
    );
    const control = screen.getByTestId('custom') as HTMLInputElement;
    expect(control.required).toBe(true);
    expect(control.disabled).toBe(true);
  });

  it('takes a plain child for a control that labels itself', () => {
    const { container } = render(
      <FormField supportingText="Under it">
        <FilledTextField label="Email" />
      </FormField>,
    );
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(container.querySelector('.grange-form-field-supporting')?.textContent).toBe('Under it');
  });
});

describe('FieldArray', () => {
  const Rows = (props: { min?: number; max?: number; defaultCount?: number }) => (
    <FieldArray name="address" {...props}>
      {(rows, add, canAdd) => (
        <>
          {rows.map((row) => (
            <div key={row.key} data-testid="row">
              <FilledTextField label={`City ${row.index + 1}`} name={row.fieldName('city')} />
              <FilledButton onClick={row.remove}>{`Remove ${row.index + 1}`}</FilledButton>
              <FilledButton disabled={row.isFirst} onClick={row.moveUp}>{`Up ${row.index + 1}`}</FilledButton>
            </div>
          ))}
          <FilledButton disabled={!canAdd} onClick={add}>
            Add
          </FilledButton>
        </>
      )}
    </FieldArray>
  );

  it('names the inputs so a server can read the group back', () => {
    render(<Rows />);
    expect(field('City 1').name).toBe('address.0.city');
  });

  it('adds and removes rows', async () => {
    const user = userEvent.setup();
    render(<Rows />);
    expect(screen.getAllByTestId('row')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getAllByTestId('row')).toHaveLength(3);

    await user.click(screen.getByRole('button', { name: 'Remove 2' }));
    expect(screen.getAllByTestId('row')).toHaveLength(2);
  });

  it('keeps each row with its own value when one in the middle is removed', async () => {
    const user = userEvent.setup();
    render(<Rows defaultCount={3} />);
    await user.type(field('City 1'), 'Paris');
    await user.type(field('City 2'), 'Rome');
    await user.type(field('City 3'), 'Oslo');

    await user.click(screen.getByRole('button', { name: 'Remove 2' }));
    // The stable keys are the point: with index keys React would reuse the third row's DOM for
    // the second and the remaining values would shuffle.
    expect(field('City 1').value).toBe('Paris');
    expect(field('City 2').value).toBe('Oslo');
  });

  it('reorders rows, carrying their values with them', async () => {
    const user = userEvent.setup();
    render(<Rows defaultCount={2} />);
    await user.type(field('City 1'), 'Paris');
    await user.type(field('City 2'), 'Rome');

    await user.click(screen.getByRole('button', { name: 'Up 2' }));
    expect(field('City 1').value).toBe('Rome');
    expect(field('City 2').value).toBe('Paris');
  });

  it('stops at the fewest and the most rows it is given', async () => {
    const user = userEvent.setup();
    render(<Rows defaultCount={1} min={1} max={2} />);
    await user.click(screen.getByRole('button', { name: 'Remove 1' }));
    expect(screen.getAllByTestId('row')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getAllByTestId('row')).toHaveLength(2);
    expect((screen.getByRole('button', { name: 'Add' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('starts with at least the minimum, whatever it was told', () => {
    render(<Rows defaultCount={1} min={3} />);
    expect(screen.getAllByTestId('row')).toHaveLength(3);
  });

  it('posts a whole group through the form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((_v, event: React.FormEvent) => event.preventDefault());
    render(
      <Form
        aria-label="Addresses"
        onSubmit={onSubmit}
        actions={<FilledButton type="submit">Save</FilledButton>}
      >
        <Rows defaultCount={2} />
      </Form>,
    );
    await user.type(field('City 1'), 'Paris');
    await user.type(field('City 2'), 'Rome');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit.mock.calls[0]![0]).toMatchObject({
      'address.0.city': 'Paris',
      'address.1.city': 'Rome',
    });
  });
});

describe('what the field is described by', () => {
  /*
   * M3 replaces the supporting text with the error rather than showing both, so only one of the
   * two is in the DOM. The hooks link both unconditionally, which would leave the input
   * described by an element that was never rendered: a reference that announces nothing and
   * looks perfectly fine in the markup.
   */
  const describedText = (control: Element) => {
    const ids = control.getAttribute('aria-describedby')?.split(' ') ?? [];
    return ids.map((id) => document.getElementById(id)?.textContent ?? '(missing)');
  };

  it('points at the supporting text while there is no error', () => {
    render(<FilledTextField label="Email" supportingText="We never share it" />);
    expect(describedText(field('Email'))).toEqual(['We never share it']);
  });

  it('points at the error instead, and not at the text it replaced', () => {
    render(<FilledTextField label="Email" supportingText="We never share it" error errorText="Required" />);
    expect(describedText(field('Email'))).toEqual(['Required']);
  });

  it('keeps the counter alongside whichever message is showing', () => {
    const { rerender } = render(<FilledTextField label="Email" supportingText="Hint" maxLength={10} />);
    expect(describedText(field('Email'))).toEqual(['Hint', '0/10']);
    rerender(
      <FilledTextField label="Email" supportingText="Hint" maxLength={10} error errorText="Too long" />,
    );
    expect(describedText(field('Email'))).toEqual(['Too long', '0/10']);
  });

  it('describes nothing when there is nothing to say', () => {
    render(<FilledTextField label="Email" />);
    expect(field('Email').getAttribute('aria-describedby')).toBeNull();
  });

  it('does the same for a number field and a select', async () => {
    const user = userEvent.setup();
    render(
      <Form
        aria-label="Details"
        validate={() => ({ count: 'Too few', size: 'Pick one' })}
        actions={<FilledButton type="submit">Save</FilledButton>}
      >
        <NumberField label="Count" name="count" supportingText="How many" />
        <Select label="Size" name="size" supportingText="Roughly">
          <SelectItem key="s">Small</SelectItem>
        </Select>
      </Form>,
    );
    expect(describedText(field('Count'))).toEqual(['How many']);

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(describedText(field('Count'))).toEqual(['Too few']);
    expect(describedText(screen.getByRole('button', { name: /Size/ }))).toEqual(['Pick one']);
  });
});
