import handlebars from 'handlebars';
import IParseMailTemplateDTO from '../dtos/IParseMailTemplateDTO';
import IMailTemplateProvider from '../models/IMailTemplateProvider';
import fs from 'fs';
import path from 'path';

class HandlebarsMailTemplateProvider implements IMailTemplateProvider {
  public async parse({
    file,
    variables,
  }: IParseMailTemplateDTO): Promise<string> {
    const templateFileContent = await fs.promises.readFile(file, {
      encoding: 'utf-8',
    });
    const pathFooterTemplate = path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      'views',
      'partials',
      'footer.hbs',
    );
    const footerTemplate = await fs.promises.readFile(pathFooterTemplate, {
      encoding: 'utf-8',
    });

    const pathHeaderTemplate = path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      'views',
      'partials',
      'header.hbs',
    );

    const headerTemplate = await fs.promises.readFile(pathHeaderTemplate, {
      encoding: 'utf-8',
    });

    handlebars.registerPartial('header', headerTemplate);
    handlebars.registerPartial('footer', footerTemplate);
    const parseTemplate = handlebars.compile(templateFileContent);

    return parseTemplate(variables);
  }
}

export default HandlebarsMailTemplateProvider;
