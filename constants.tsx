
import { AppState, GroupCategory, GroupRole, CoreRole } from './types';

export const INITIAL_DATA: AppState = {
  persons: [
    { id: 'p1', name: 'Anders Admin', email: 'anders@lmk.no', phone: '900 11 001', is_admin: true, is_active: true, core_role: CoreRole.ADMIN },
    { id: 'p2', name: 'Lise Lovsang', email: 'lise@lmk.no', phone: '900 22 002', is_admin: false, is_active: true, core_role: CoreRole.TEAM_LEADER },
    { id: 'p3', name: 'Tom Tekniker', email: 'tom@lmk.no', phone: '900 33 003', is_admin: false, is_active: true, core_role: CoreRole.MEMBER },
    { id: 'p5', name: 'Per Pastor', email: 'per@lmk.no', phone: '900 55 005', is_admin: true, is_active: true, core_role: CoreRole.PASTOR },
    { id: 'p7', name: 'Morten Møtevert', email: 'morten@lmk.no', phone: '900 77 007', is_admin: false, is_active: true, core_role: CoreRole.MEMBER },
  ],
  groups: [
    { id: 'g1', name: 'Lovsang', category: GroupCategory.SERVICE, description: 'Ansvarlig for musikk og tilbedelse under gudstjenester.' },
    { id: 'g2', name: 'Teknikk', category: GroupCategory.SERVICE, description: 'Lyd, lys og bilde.' },
    { id: 'g3', name: 'Vertskap', category: GroupCategory.SERVICE, description: 'Møteverter, kirkekaffe, baking og pynting.' },
    { id: 'g4', name: 'Ledelse & Forkynnelse', category: GroupCategory.SERVICE, description: 'Talerer og møteledere.' },
    { id: 'g5', name: 'Barn & Unge', category: GroupCategory.SERVICE, description: 'Barnekirke og trosopplæring.' },
  ],
  groupMembers: [
    { id: 'gm1', group_id: 'g1', person_id: 'p2', role: GroupRole.LEADER, service_role_id: 'sr5' },
    { id: 'gm2', group_id: 'g2', person_id: 'p3', role: GroupRole.MEMBER, service_role_id: 'sr6' },
    { id: 'gm4', group_id: 'g4', person_id: 'p5', role: GroupRole.LEADER, service_role_id: 'sr1' },
    { id: 'gm6', group_id: 'g3', person_id: 'p7', role: GroupRole.MEMBER, service_role_id: 'sr9' },
  ],
  serviceRoles: [
    {
      id: 'sr1',
      name: 'Møteleder',
      default_instructions: [
        'Snakke med taler om tema',
        'Lytte til Gud og finne ut hvor du vil med gudstjenesten',
        'Ha dialog med lovsangsleder om setliste',
        'Sy sammen gudstjenesten og lage en kjøreplan',
        'Spørre Lars eller Magnar om en av de kan forrette nattverden og lyse velsignelsen, evt. finne noen andre som kan gjøre det',
        'Være med på å dele ut nattverden eller finne noen andre til å gjøre det',
        'Sette deg inn i søndagens info og kollekt (Dette får du tilsendt fredag før gudstjenesten?)',
        'Eventuelt lage ekstra bønnevandringsposter hvis du vil (Snakk med møtevert)',
        'Forberede deg åndelig',
        'Lede bønnemøtet på søndag kl. 10.00 - 10.45. Sett Gud på tronen, vær i bønn og bruk gjerne lovsang (Kl. 10.30 kommer de andre som skal bidra i gudstjenesten for å være med å be)',
        'Ha en gjennomgang av gudstjenesten med taler, lovsangsleder og teknikere kl. 10.45',
        'Ha skrevet ut en kjøreplan som deles ut, slik at alle vet hva som skjer når',
        'Holde styr på tida og si ifra til lovsangsleder at de skal begynne gudstjenesten',
        'Lede menigheten gjennom gudstjenesten (Bli leda av Gud, observere menigheten. Vær åpen for at kjøreplanen kan endres underveis - i samarbeid med lovsangsleder)',
        'Legge til rette for å sitte igjen i salen når gudstjenesten er ferdig hvis du ønsker det',
        'Ansvar for: Velkommen, bønn, søndagens info, informere om nattverd/bønnevandring, kollekt, avslutning/sendelse, kirkekaffe',
        'Eventuelt ansvar for: Bibellesning, vitnesbyrd, bønn for taleren, stillhet/delestund o.l.'
      ],
      is_active: true
    },
    {
      id: 'sr2',
      name: 'Taler',
      default_instructions: [
        'Lage preken og forberede deg åndelig',
        'Ta kontakt med møteleder og lovsangsleder om tema',
        'Sende eventuell PowerPoint eller annet som skal opp på skjermen til bildetekniker i god tid',
        'Møte opp senest kl. 10.00 for å være med på bønnemøtet',
        'Være med på gjennomgang av gudstjenesten kl. 10.45',
        'Holde preken'
      ],
      is_active: true
    },
    {
      id: 'sr3',
      name: 'Forbønn',
      default_instructions: [
        'Forberede deg åndelig',
        'Være med og be på bønnemøtet søndag før gudstjenesten kl. 10.00 - 10.45',
        'Be for dem som ønsker det under gudstjenesten (Etter nattverden)',
        'Bli igjen i salen litt etter møtet er ferdig for å se om noen vil bli bedt for'
      ],
      is_active: true
    },
    {
      id: 'sr4',
      name: 'Barnekirke',
      default_instructions: [
        'Rigge klart det du trenger til opplegget du skal ha',
        'Finne frem tegnesaker til barna på et av bordene i møtesalen',
        'Eventuelt samarbeide med møtevert/gudstjenesteleder om bønnestasjon tilpasset barna',
        'Husk at du må ha hentet alt du trenger før kl. 10.00 (For å ikke forstyrre bønnemøtet)',
        'Bli med på bønnemøtet kl. 10.30 (Du kan gjerne komme fra kl. 10.00)',
        'Være med på gjennomgang av gudstjenesten kl. 10.45',
        'Ha samling/undervisning med barna under talen',
        'Sørge for at barna er tilbake i møtesalen innen nattverden',
        'Rigge ned alt du har rigga opp'
      ],
      is_active: true
    },
    {
      id: 'sr5',
      name: 'Lovsang',
      default_instructions: [
        'Passe på at du får med deg iPadene hjem fra gudstjenesten',
        'Ta kontakt med taler og møteleder om tema og visjon for gudstjenesten',
        'Lage setliste, fikse blekker i riktig toneart og sende til teamet (Senest 5 dager før)',
        'Organisere øving og oppmøtetidspunkt på søndagen',
        'Ta kontakt med lydmann om oppmøte (Senest lørdag ettermiddag)',
        'Sende setliste til bildetekniker i god tid (Si ifra om nye sanger)',
        'Forberede deg åndelig (Lovsynge, be, lese Bibelen, lytte til Gud)',
        'Sørge for at iPadene er ladet opp med riktige blekker',
        'Kunne sangene godt nok til å lede teamet og salen inn i tilbedelse',
        'Være ferdig med øving senest kl. 10.30 for å delta på bønnemøtet',
        'Være med på gjennomgang av gudstjenesten kl. 10.45',
        'Lede menigheten i lovsang (Være åpen for endringer i samarbeid med møteleder)'
      ],
      is_active: true
    },
    {
      id: 'sr6',
      name: 'Lyd',
      default_instructions: [
        'Møte opp søndag morgen etter avtale med lovsangsleder',
        'Ta ansvar for linjesjekk og lydprøve',
        'Bli med på bønnemøtet kl. 10.30 (Gjerne fra kl. 10.00)',
        'Være med på gjennomgang av gudstjenesten kl. 10.45',
        'Styre lyden aktivt (Lytte og følge med på tegn fra teamet)',
        'Sette på rolig lovsang i det gudstjenesten er ferdig'
      ],
      is_active: true
    },
    {
      id: 'sr7',
      name: 'Bilde',
      default_instructions: [
        'Møte opp på søndag senest kl. 10.00',
        'Gjøre deg kjent med setlista og forberede eventuelle endringer',
        'Gjøre deg kjent med info, videoer eller PowerPoint som skal vises',
        'Bli med på bønnemøtet kl. 10.30 (Gjerne fra kl. 10.00)',
        'Være med på gjennomgang av gudstjenesten kl. 10.45',
        'Styre tekst og alt visuelt innhold under gudstjenesten'
      ],
      is_active: true
    },
    {
      id: 'sr8',
      name: 'Rigging',
      default_instructions: [
        'Rigge opp og ned kirkekaffebordene',
        'Ta kontakt med lovsangsleder om hvilke instrumenter som skal rigges',
        'Rigge opp og ned scenen (Detaljer avklares med Lars)'
      ],
      is_active: true
    },
    {
      id: 'sr9',
      name: 'Møtevert',
      default_instructions: [
        'Rigge klart nattverdsbordet (Duk, glass, juice, oblater, brett til brukte glass)',
        'Rigge opp faste bønneposter (Lysgloben, korset med byrdesteiner)',
        'Eventuelt rigge andre bønneposter etter avtale med møteleder',
        'Sjekke at det er nok små lys til globen',
        'Hent alt utstyr før kl. 10.00 (For å ikke forstyrre bønnemøtet)',
        'Bli med på bønnemøtet kl. 10.30',
        'Ønske velkommen i døra fra kl. 10.45 til kl. 11.15',
        'Rydde nattverdsglass ut på kjøkkenet etter nattverden',
        'Slukke levende lys og rigge ned utstyr etter gudstjenesten'
      ],
      is_active: true
    },
    {
      id: 'sr10',
      name: 'Kjøkken',
      default_instructions: [
        'Koke kaffe og tevann ferdig senest kl. 10.45',
        'Sette frem te, kakao, saft, vann og twist/annet godt',
        'Sette frem all mat og kaker til kirkekaffen',
        'Ta ansvar for oppvask etter kirkekaffen',
        'Se over salen for brukte kopper og nattverdsglass når møtet er ferdig',
        'Rydde på plass alt utstyr'
      ],
      is_active: true
    },
    {
      id: 'sr11',
      name: 'Baking',
      default_instructions: [
        'Bake kake(r) og ta med til gudstjenesten',
        'Koordiner med kjøkkenansvarlig for den aktuelle søndagen'
      ],
      is_active: true
    },
    {
      id: 'sr12',
      name: 'Pynting',
      default_instructions: [
        'Pynte nattverdsbordet (Lys og blomst)',
        'Pynte bordene i kirkekafferommet og baren ved miksepulten',
        'Tenne lys (Nattverdsbord, lysglobe, kirkekafferom)',
        'Slukke levende lys når gudstjenesten er over',
        'Rigge ned pynt og rydde opp'
      ],
      is_active: true
    }
  ],
  groupServiceRoles: [
    { id: 'gsr1', group_id: 'g4', service_role_id: 'sr1', is_active: true },
    { id: 'gsr2', group_id: 'g4', service_role_id: 'sr2', is_active: true },
    { id: 'gsr3', group_id: 'g1', service_role_id: 'sr5', is_active: true },
    { id: 'gsr4', group_id: 'g3', service_role_id: 'sr9', is_active: true },
    { id: 'gsr5', group_id: 'g2', service_role_id: 'sr6', is_active: true },
    { id: 'gsr6', group_id: 'g3', service_role_id: 'sr10', is_active: true },
    { id: 'gsr7', group_id: 'g2', service_role_id: 'sr7', is_active: true },
    { id: 'gsr8', group_id: 'g5', service_role_id: 'sr4', is_active: true },
  ],
  eventTemplates: [
    { id: 't1', title: 'Gudstjeneste Standard', type: 'Gudstjeneste', recurrence_rule: 'Hver søndag kl. 11:00' },
  ],
  eventOccurrences: [],
  assignments: [
    { id: 'a1', template_id: 't1', service_role_id: 'sr1', person_id: null },
    { id: 'a2', template_id: 't1', service_role_id: 'sr2', person_id: null },
    { id: 'a3', template_id: 't1', service_role_id: 'sr5', person_id: null },
    { id: 'a4', template_id: 't1', service_role_id: 'sr9', person_id: null },
  ],
  programItems: [
    { id: 'pi0', template_id: 't1', title: 'Velkommen ved inngang', duration_minutes: 15, service_role_id: 'sr9', order: 0 },
    { id: 'pi1', template_id: 't1', title: 'Lovsang x2', duration_minutes: 7, group_id: 'g1', order: 1 },
    { id: 'pi2', template_id: 't1', title: 'Velkommen. Åpningsord', duration_minutes: 3, service_role_id: 'sr1', order: 2 },
    { id: 'pi3', template_id: 't1', title: 'Bønn', duration_minutes: 2, service_role_id: 'sr1', order: 3 },
    { id: 'pi9', template_id: 't1', title: 'Tale / undervisning', duration_minutes: 20, service_role_id: 'sr2', order: 6 },
  ],
  tasks: [],
  noticeMessages: [
    {
      id: 'm1',
      sender_id: 'p5',
      recipient_role: CoreRole.TEAM_LEADER,
      title: 'Husk lederforum mandag!',
      content: 'Vi gleder oss til å se alle gruppeledere til en samling på mandag kl 19:00. Vi skal snakke om visjonen for høsten.',
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  changeLogs: []
};
