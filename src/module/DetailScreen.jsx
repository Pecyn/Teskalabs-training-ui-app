import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Container, Card, CardHeader, CardBody } from 'reactstrap';
import { DateTime, CopyableInput, usePubSub } from 'asab_webui_components';

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
  const { app } = usePubSub();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDetail = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${DETAIL_URL}/${id}`);
      if (!res.ok) {
        throw new Error(`Data fetch failed with status ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      app.addAlertFromException(e, t('Training|Failed to load detail'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  if (isLoading)
    return (
      <Container className="mt-3">
        <Card>
          <CardHeader>
            <h5 className="mb-0 placeholder-glow">
              <span className="placeholder col-3" />
            </h5>
          </CardHeader>
          <CardBody>
            <dl className="mb-0 placeholder-glow">
              {Array(8)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="row align-items-center mb-1">
                    <dt className="col-sm-3">
                      <span className="placeholder col-6" />
                    </dt>
                    <dd className="col-sm-9 mb-0">
                      <span className="placeholder col-12" />
                    </dd>
                  </div>
                ))}
            </dl>
          </CardBody>
        </Card>
      </Container>
    );

  if (!data)
    return (
      <Container className="mt-3">
        <Card>
          <CardHeader />
          <CardBody>
            <dl className="mb-0" />
          </CardBody>
        </Card>
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
