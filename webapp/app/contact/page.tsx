'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import ReCAPTCHA from 'react-google-recaptcha';
import {
  StyledCaptcha,
  StyledContactContainer,
  StyledContactSuccess,
  StyledErrorContent,
  StyledForm,
  StyledFormContainer,
  StyledTitleContainer,
} from './styles';
import { contactTranslations } from './data';
import { useMutation } from '@apollo/client';
import { SEND_CONTACT_US_EMAIL } from './queries';
import {
  SendContactUsEmailMutation,
  SendContactUsEmailMutationVariables,
} from '@/types/graphql_generated/graphql';
import {
  StyledHeading2,
  StyledParagraph2,
  StyledParagraph3,
  StyledParagraph4Bold,
} from '../globalStyles';

type FormValues = {
  name: string;
  from: string;
  subject: string;
  body: string;
};

const Contact = () => {
  const [error, setError] = useState<null | string>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const captchaRef = useRef<ReCAPTCHA>(null);
  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
  } = useForm<FormValues>();

  const [sendContactUsEmail, { data, error: gqlError, loading }] = useMutation<
    SendContactUsEmailMutation,
    SendContactUsEmailMutationVariables
  >(SEND_CONTACT_US_EMAIL);

  useEffect(() => {
    if (Object.values(formErrors).length > 0)
      setError('Please enter a valid email address');
    if (data) {
      if (data.sendContactUsEmail.__typename === 'SendContactUsEmailResult')
        setSuccess(true);
      if (data.sendContactUsEmail.__typename === 'SmartError')
        setError('Something went wrong. Try again!');

      if (captchaRef.current) captchaRef.current.reset();
    }
  }, [data, gqlError, formErrors]);

  const onSubmit = handleSubmit(async data => {
    setError(null);
    if (!captchaRef.current) return;
    const token = captchaRef.current.getValue();

    if (!token) {
      return setError('Please complete the ReCaptcha before submitting');
    }

    sendContactUsEmail({
      variables: {
        input: data,
      },
    });
  });

  return (
    <StyledContactContainer>
      <StyledTitleContainer>
        <StyledHeading2>
          {contactTranslations.page_contact_title}
        </StyledHeading2>
        <StyledParagraph2>
          {contactTranslations.page_contact_description}
        </StyledParagraph2>
      </StyledTitleContainer>
      <StyledFormContainer>
        {!success && (
          <StyledForm onSubmit={onSubmit}>
            <input
              type="text"
              placeholder={contactTranslations.page_contact_input_name}
              {...register('name', { required: true })}
            />
            <input
              placeholder={contactTranslations.page_contact_input_email}
              {...register('from', {
                required: true,
                pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
              })}
            />
            <input
              type="text"
              placeholder={contactTranslations.page_contact_input_subject}
              {...register('subject', { required: true })}
            />
            <textarea
              placeholder={contactTranslations.page_contact_input_message}
              {...register('body', { required: true })}
            />
            <StyledCaptcha>
              <ReCAPTCHA
                sitekey={process.env.RECAPTCHA_SITE_KEY!}
                ref={captchaRef}
              />
            </StyledCaptcha>
            <button type="submit">
              <StyledParagraph4Bold>
                {loading
                  ? contactTranslations.page_contact_btn_loading
                  : contactTranslations.page_contact_btn_submit}
              </StyledParagraph4Bold>
            </button>
          </StyledForm>
        )}
        {success && (
          <StyledContactSuccess>
            <StyledParagraph3>
              {contactTranslations.page_contact_success}
            </StyledParagraph3>
          </StyledContactSuccess>
        )}
        {error && (
          <StyledErrorContent>
            <StyledParagraph3>{error}</StyledParagraph3>
          </StyledErrorContent>
        )}
      </StyledFormContainer>
    </StyledContactContainer>
  );
};

export default Contact;
