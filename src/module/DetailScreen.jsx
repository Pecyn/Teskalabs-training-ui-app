import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Container, Card, CardHeader, CardBody } from 'reactstrap';
import { DateTime, CopyableInput } from 'asab_webui_components';

const DETAIL_URL = 'https://devtest.teskalabs.com/detail';

function CardBodyItem({ label, children }) {
  return (
    <div className="row align-items-center mb-1">
      <dt className="col-sm-3">{label}</dt>
      <dd className="col-sm-9 mb-0">{children}</dd>
    </div>
  );
}

export function DetailScreen() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${DETAIL_URL}/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, [id]);

  if (error)
    return (
      <Container>
        <p className="text-danger">{error}</p>
      </Container>
    );
  if (!data)
    return (
      <Container>
        <p>Loading...</p>
      </Container>
    );

  return (
    <Container className="mt-3">
      <Card>
        <CardHeader>
          <h5 className="mb-0">{data.username}</h5>
        </CardHeader>
        <CardBody>
          <dl className="mb-0">
            <CardBodyItem label={t('Training|ID')}>
              <CopyableInput value={data.id} type="text" />
            </CardBodyItem>

            <CardBodyItem label={t('Training|Email')}>
              <CopyableInput value={data.email} type="text" />
            </CardBodyItem>

            <CardBodyItem label={t('Training|Address')}>
              <CopyableInput value={data.address} type="text" />
            </CardBodyItem>

            <CardBodyItem label={t('Training|Phone')}>
              <CopyableInput value={data.phone_number} type="text" />
            </CardBodyItem>

            <CardBodyItem label={t('Training|IP address')}>
              <CopyableInput value={data.ip_address} type="text" />
            </CardBodyItem>

            <CardBodyItem label={t('Training|MAC address')}>
              <CopyableInput value={data.mac_address} type="text" />
            </CardBodyItem>

            <CardBodyItem label={t('Training|Created')}>
              <div className="py-2">
                <DateTime value={data.created} />
              </div>
            </CardBodyItem>

            <CardBodyItem label={t('Training|Last sign in')}>
              <div className="py-2">
                <DateTime value={data.last_sign_in} />
              </div>
            </CardBodyItem>
          </dl>
        </CardBody>
      </Card>
    </Container>
  );
}
